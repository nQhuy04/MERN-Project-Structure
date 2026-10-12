import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { EmailToken } from '../../src/modules/auth/emailTokens.model.js';
import { emailService } from '../../src/modules/email/email.service.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { Setting } from '../../src/modules/settings/settings.model.js';
import { User } from '../../src/modules/users/users.model.js';
import { mailer } from '../../src/shared/lib/mailer.js';
import { createUser } from '../helpers/factories.js';

const REQUEST_URL = '/api/v1/auth/magic-link';
const VERIFY_URL = '/api/v1/auth/magic-link/verify';
const REQUEST_MESSAGE = 'Nếu email có tài khoản, chúng tôi đã gửi liên kết đăng nhập';
const ATTACKER_PASSWORD = 'mat-khau-ke-gian';

async function requestMagicToken(email) {
  const spy = vi.spyOn(emailService, 'sendMagicLinkEmail');
  await request(app).post(REQUEST_URL).send({ email }).expect(200);
  return spy.mock.calls.at(-1)?.[0].token;
}

async function setSetting(key, value) {
  await Setting.updateOne({ key }, { $set: { value } }, { upsert: true });
}

afterEach(async () => {
  vi.restoreAllMocks();
  await mailer.waitForPending();
  await Promise.all([
    User.deleteMany({}),
    Session.deleteMany({}),
    EmailToken.deleteMany({}),
    Setting.deleteMany({}),
  ]);
});

describe('[bai-09] POST /auth/magic-link — gửi liên kết đăng nhập', () => {
  it('tài khoản tồn tại → gửi link 15 phút; email lạ → cùng response, không gửi', async () => {
    const user = await createUser();
    const spy = vi.spyOn(emailService, 'sendMagicLinkEmail');

    for (const email of [user.email, 'khong-co@example.com']) {
      const res = await request(app).post(REQUEST_URL).send({ email });
      expect(res.body.message).toBe(REQUEST_MESSAGE);
    }
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0].expiresInMinutes).toBe(15);
  });

  it('Super Admin tắt magic link → 403 FEATURE_DISABLED', async () => {
    await setSetting('auth.magicLinkEnabled', false);

    const res = await request(app).post(REQUEST_URL).send({ email: 'an@example.com' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FEATURE_DISABLED');
  });
});

describe('[bai-09] POST /auth/magic-link/verify — đăng nhập bằng liên kết', () => {
  it('token hợp lệ → đăng nhập (access token + cookie refresh), token dùng 1 lần', async () => {
    const user = await createUser();
    const token = await requestMagicToken(user.email);

    const res = await request(app).post(VERIFY_URL).send({ token });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.id).toBe(String(user._id));
    expect(res.headers['set-cookie'].some((cookie) => cookie.startsWith('refresh_token='))).toBe(
      true,
    );

    const reused = await request(app).post(VERIFY_URL).send({ token });
    expect(reused.body.error.code).toBe('TOKEN_INVALID');
  });

  it('tài khoản chưa kích hoạt → bấm link là kích hoạt luôn + email chào mừng', async () => {
    const user = await createUser({ emailVerifiedAt: null });
    const token = await requestMagicToken(user.email);
    const welcomeSpy = vi.spyOn(emailService, 'sendWelcomeEmail');

    await request(app).post(VERIFY_URL).send({ token }).expect(200);

    expect((await User.findById(user._id)).emailVerifiedAt).toBeInstanceOf(Date);
    expect(welcomeSpy).toHaveBeenCalledOnce();
  });

  it('kích hoạt qua magic link → xoá mật khẩu người đăng ký đặt (chống chiếm trước tài khoản)', async () => {
    // Kẻ gian đăng ký trước bằng email nạn nhân với mật khẩu của mình, không xác thực được.
    const user = await createUser({ emailVerifiedAt: null, password: ATTACKER_PASSWORD });
    const token = await requestMagicToken(user.email);

    // Nạn nhân bấm magic link → tài khoản được kích hoạt.
    await request(app).post(VERIFY_URL).send({ token }).expect(200);

    expect((await User.findById(user._id).select('+passwordHash')).passwordHash).toBeUndefined();
    const attempt = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: ATTACKER_PASSWORD });
    // 401 chỉ dành cho access/refresh token → sai thông tin đăng nhập là 400.
    expect(attempt.status).toBe(400);
    expect(attempt.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('tài khoản đã kích hoạt từ trước → magic link KHÔNG đụng tới mật khẩu', async () => {
    const user = await createUser({ password: ATTACKER_PASSWORD });
    const token = await requestMagicToken(user.email);

    await request(app).post(VERIFY_URL).send({ token }).expect(200);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: ATTACKER_PASSWORD });
    expect(login.status).toBe(200);
  });

  it('tắt magic link sau khi đã gửi → link đã gửi cũng hết hiệu lực', async () => {
    const user = await createUser();
    const token = await requestMagicToken(user.email);
    await setSetting('auth.magicLinkEnabled', false);

    const res = await request(app).post(VERIFY_URL).send({ token });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FEATURE_DISABLED');
    expect(await Session.countDocuments()).toBe(0);
  });

  it('tài khoản bị khoá → 403 ACCOUNT_LOCKED, không tạo phiên', async () => {
    const user = await createUser();
    const token = await requestMagicToken(user.email);
    await User.updateOne({ _id: user._id }, { $set: { lockedAt: new Date() } });

    const res = await request(app).post(VERIFY_URL).send({ token });

    expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
    expect(await Session.countDocuments()).toBe(0);
  });
});

describe('[bai-09] Tắt đăng ký (auth.registrationEnabled = false)', () => {
  it('POST /auth/register → 403 REGISTRATION_DISABLED, không tạo tài khoản', async () => {
    await setSetting('auth.registrationEnabled', false);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'moi@example.com', name: 'Mới', password: 'mat-khau-moi-1' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('REGISTRATION_DISABLED');
    expect(await User.countDocuments()).toBe(0);
  });
});
