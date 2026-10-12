import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { EmailToken } from '../../src/modules/auth/emailTokens.model.js';
import { emailService } from '../../src/modules/email/email.service.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { sessionsService } from '../../src/modules/sessions/sessions.service.js';
import { User } from '../../src/modules/users/users.model.js';
import { mailer } from '../../src/shared/lib/mailer.js';
import { verifyPassword } from '../../src/shared/utils/password.js';
import { hashToken } from '../../src/shared/utils/token.js';
import { signIn } from '../helpers/auth.js';
import { DEFAULT_PASSWORD, createUser } from '../helpers/factories.js';

const FORGOT_URL = '/api/v1/auth/forgot-password';
const RESET_URL = '/api/v1/auth/reset-password';
const CHANGE_URL = '/api/v1/users/me/password';
const NEW_PASSWORD = 'mat-khau-moi-123';
const FORGOT_MESSAGE = 'Nếu email có tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu';

async function requestResetToken(email) {
  const spy = vi.spyOn(emailService, 'sendResetPasswordEmail');
  await request(app).post(FORGOT_URL).send({ email }).expect(200);
  return spy.mock.calls.at(-1)?.[0].token;
}

async function passwordMatches(userId, password) {
  const user = await User.findById(userId).select('+passwordHash');
  return verifyPassword(password, user.passwordHash);
}

afterEach(async () => {
  vi.restoreAllMocks();
  await mailer.waitForPending();
  await Promise.all([User.deleteMany({}), Session.deleteMany({}), EmailToken.deleteMany({})]);
});

describe('[bai-08] POST /auth/forgot-password — quên mật khẩu', () => {
  it('email có tài khoản → gửi link đặt lại (60 phút)', async () => {
    const user = await createUser();
    const spy = vi.spyOn(emailService, 'sendResetPasswordEmail');

    const res = await request(app).post(FORGOT_URL).send({ email: user.email });

    expect(res.body.message).toBe(FORGOT_MESSAGE);
    const { token, expiresInMinutes } = spy.mock.calls[0][0];
    expect(expiresInMinutes).toBe(60);
    expect(
      await EmailToken.exists({ tokenHash: hashToken(token), type: 'RESET_PASSWORD' }),
    ).toBeTruthy();
  });

  it('email không tồn tại hoặc tài khoản bị khoá → cùng response, không gửi email', async () => {
    const locked = await createUser({ lockedAt: new Date() });
    const spy = vi.spyOn(emailService, 'sendResetPasswordEmail');

    for (const email of ['khong-co@example.com', locked.email]) {
      const res = await request(app).post(FORGOT_URL).send({ email });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe(FORGOT_MESSAGE);
    }
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('[bai-08] POST /auth/reset-password — đặt lại mật khẩu', () => {
  it('token hợp lệ → đổi mật khẩu, thu hồi MỌI phiên, gửi email báo đổi mật khẩu', async () => {
    const user = await createUser();
    const oldSession = await signIn(user);
    const token = await requestResetToken(user.email);
    const changedSpy = vi.spyOn(emailService, 'sendPasswordChangedEmail');

    const res = await request(app).post(RESET_URL).send({ token, password: NEW_PASSWORD });

    expect(res.status).toBe(200);
    expect(await passwordMatches(user._id, NEW_PASSWORD)).toBe(true);
    expect(await Session.countDocuments({ userId: user._id })).toBe(0);
    expect(
      (await request(app).get('/api/v1/users/me').set('Authorization', oldSession.authHeader))
        .status,
    ).toBe(401);
    expect(changedSpy).toHaveBeenCalledOnce();
  });

  it('tài khoản chưa kích hoạt → tự kích hoạt + email chào mừng', async () => {
    const user = await createUser({ emailVerifiedAt: null });
    const token = await requestResetToken(user.email);
    const welcomeSpy = vi.spyOn(emailService, 'sendWelcomeEmail');

    await request(app).post(RESET_URL).send({ token, password: NEW_PASSWORD }).expect(200);

    expect((await User.findById(user._id)).emailVerifiedAt).toBeInstanceOf(Date);
    expect(welcomeSpy).toHaveBeenCalledOnce();
  });

  it('token dùng 1 lần; token sai → 400 TOKEN_INVALID', async () => {
    const user = await createUser();
    const token = await requestResetToken(user.email);
    await request(app).post(RESET_URL).send({ token, password: NEW_PASSWORD }).expect(200);

    for (const usedOrWrong of [token, 'token-sai']) {
      const res = await request(app)
        .post(RESET_URL)
        .send({ token: usedOrWrong, password: 'khac-12345' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    }
  });

  it('mật khẩu mới không đạt quy tắc → 400 VALIDATION_ERROR, token vẫn dùng được', async () => {
    const user = await createUser();
    const token = await requestResetToken(user.email);

    const res = await request(app).post(RESET_URL).send({ token, password: '123' });

    expect(res.body.error.details[0].field).toBe('password');
    await request(app).post(RESET_URL).send({ token, password: NEW_PASSWORD }).expect(200);
  });

  it('lỗi giữa chừng → transaction rollback: token, mật khẩu, phiên đều giữ nguyên', async () => {
    const user = await createUser();
    await signIn(user);
    const token = await requestResetToken(user.email);
    vi.spyOn(sessionsService, 'revokeAllForUser').mockRejectedValueOnce(new Error('DB lỗi'));

    const failed = await request(app).post(RESET_URL).send({ token, password: NEW_PASSWORD });

    expect(failed.status).toBe(500);
    expect(await passwordMatches(user._id, DEFAULT_PASSWORD)).toBe(true);
    expect(await Session.countDocuments({ userId: user._id })).toBe(1);
    // Token chưa bị tiêu thụ → người dùng thử lại được.
    await request(app).post(RESET_URL).send({ token, password: NEW_PASSWORD }).expect(200);
  });
});

describe('[bai-08] PATCH /users/me/password — đổi mật khẩu khi đang đăng nhập', () => {
  it('đúng mật khẩu hiện tại → đổi, thu hồi phiên KHÁC, giữ phiên hiện tại', async () => {
    const user = await createUser();
    const current = await signIn(user);
    const other = await signIn(user);

    const res = await request(app)
      .patch(CHANGE_URL)
      .set('Authorization', current.authHeader)
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: NEW_PASSWORD });

    expect(res.status).toBe(200);
    expect(await passwordMatches(user._id, NEW_PASSWORD)).toBe(true);
    expect(await Session.exists({ _id: current.session._id })).toBeTruthy();
    expect(await Session.exists({ _id: other.session._id })).toBeNull();
  });

  it('sai mật khẩu hiện tại → 400 (không phải 401) kèm lỗi ở ô currentPassword', async () => {
    const user = await createUser();
    const current = await signIn(user);

    const res = await request(app)
      .patch(CHANGE_URL)
      .set('Authorization', current.authHeader)
      .send({ currentPassword: 'sai-roi', newPassword: NEW_PASSWORD });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
    expect(res.body.error.details).toEqual([
      { field: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' },
    ]);
    expect(await passwordMatches(user._id, DEFAULT_PASSWORD)).toBe(true);
  });

  it('tài khoản chỉ dùng Google (chưa có mật khẩu) → 400 PASSWORD_NOT_SET', async () => {
    const user = await createUser({ passwordHash: undefined, googleId: 'google-1' });
    const current = await signIn(user);

    const res = await request(app)
      .patch(CHANGE_URL)
      .set('Authorization', current.authHeader)
      .send({ currentPassword: 'bat-ky', newPassword: NEW_PASSWORD });

    expect(res.body.error.code).toBe('PASSWORD_NOT_SET');
  });

  it('chưa đăng nhập → 401', async () => {
    const res = await request(app)
      .patch(CHANGE_URL)
      .send({ currentPassword: DEFAULT_PASSWORD, newPassword: NEW_PASSWORD });

    expect(res.status).toBe(401);
  });
});
