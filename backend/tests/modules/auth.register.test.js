import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { EMAIL_TOKEN_TYPES, EmailToken } from '../../src/modules/auth/emailTokens.model.js';
import { emailService } from '../../src/modules/email/email.service.js';
import { USER_ROLES, User } from '../../src/modules/users/users.model.js';
import { mailer } from '../../src/shared/lib/mailer.js';
import { verifyPassword } from '../../src/shared/utils/password.js';
import { hashToken } from '../../src/shared/utils/token.js';
import { DEFAULT_PASSWORD, createUser } from '../helpers/factories.js';

const REGISTER_URL = '/api/v1/auth/register';
const VERIFY_URL = '/api/v1/auth/verify-email';
const RESEND_URL = '/api/v1/auth/resend-verification';

const NEW_ACCOUNT = { email: 'an@example.com', name: 'Nguyễn An', password: 'mat-khau-cua-an' };

/** Đăng ký rồi lấy token trong email xác thực (qua spy, không cần hộp thư thật). */
async function registerAndCaptureToken(body = NEW_ACCOUNT) {
  const spy = vi.spyOn(emailService, 'sendVerifyEmail');
  await request(app).post(REGISTER_URL).send(body).expect(200);
  return spy.mock.calls.at(-1)[0].token;
}

afterEach(async () => {
  vi.restoreAllMocks();
  await mailer.waitForPending();
  await Promise.all([User.deleteMany({}), EmailToken.deleteMany({})]);
});

describe('[bai-02] POST /auth/register — tạo tài khoản', () => {
  it('email mới → tạo tài khoản MEMBER chưa kích hoạt, mật khẩu được hash bằng bcrypt', async () => {
    const res = await request(app).post(REGISTER_URL).send(NEW_ACCOUNT);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Vui lòng kiểm tra email để hoàn tất đăng ký',
      data: null,
    });

    const user = await User.findOne({ email: NEW_ACCOUNT.email }).select('+passwordHash');
    expect(user).toMatchObject({
      name: 'Nguyễn An',
      role: USER_ROLES.MEMBER,
      emailVerifiedAt: null,
    });
    // Mật khẩu gốc không bao giờ được lưu vào database.
    expect(user.passwordHash).not.toBe(NEW_ACCOUNT.password);
    expect(await verifyPassword(NEW_ACCOUNT.password, user.passwordHash)).toBe(true);
  });

  it('dữ liệu sai → 400 VALIDATION_ERROR với lỗi từng trường', async () => {
    const res = await request(app)
      .post(REGISTER_URL)
      .send({ email: 'sai', name: ' ', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((detail) => detail.field)).toEqual([
      'email',
      'name',
      'password',
    ]);
  });

  it('không tự gán được role qua body (mass assignment)', async () => {
    await request(app)
      .post(REGISTER_URL)
      .send({ ...NEW_ACCOUNT, role: USER_ROLES.SUPER_ADMIN, emailVerifiedAt: new Date() })
      .expect(200);

    expect(await User.findOne({ email: NEW_ACCOUNT.email })).toMatchObject({
      role: USER_ROLES.MEMBER,
      emailVerifiedAt: null,
    });
  });
});

describe('[bai-03] POST /auth/register — gửi email kích hoạt & email đã tồn tại', () => {
  it('email mới → gửi email xác thực kèm token dùng 1 lần (24 giờ)', async () => {
    const spy = vi.spyOn(emailService, 'sendVerifyEmail');

    const res = await request(app).post(REGISTER_URL).send(NEW_ACCOUNT);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Vui lòng kiểm tra email để hoàn tất đăng ký',
      data: null,
    });

    const user = await User.findOne({ email: NEW_ACCOUNT.email }).select('+passwordHash');
    expect(user).toMatchObject({
      name: 'Nguyễn An',
      role: USER_ROLES.MEMBER,
      emailVerifiedAt: null,
    });
    expect(await verifyPassword(NEW_ACCOUNT.password, user.passwordHash)).toBe(true);

    expect(spy).toHaveBeenCalledOnce();
    const { token, expiresInHours } = spy.mock.calls[0][0];
    expect(expiresInHours).toBe(24);
    // DB chỉ lưu hash của token, không lưu token gốc.
    expect(
      await EmailToken.exists({ tokenHash: hashToken(token), type: 'VERIFY_EMAIL' }),
    ).toBeTruthy();
    expect(await EmailToken.exists({ tokenHash: token })).toBeNull();
  });

  it('email đã kích hoạt → response giống hệt, báo cho chủ email, không đổi mật khẩu', async () => {
    const existing = await createUser({ email: NEW_ACCOUNT.email });
    const spy = vi.spyOn(emailService, 'sendAccountExistsEmail');

    const res = await request(app).post(REGISTER_URL).send(NEW_ACCOUNT);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Vui lòng kiểm tra email để hoàn tất đăng ký');
    expect(spy).toHaveBeenCalledWith({
      user: expect.objectContaining({ email: NEW_ACCOUNT.email }),
    });
    const user = await User.findById(existing._id).select('+passwordHash');
    expect(await verifyPassword(DEFAULT_PASSWORD, user.passwordHash)).toBe(true);
    expect(await User.countDocuments()).toBe(1);
  });

  it('email chưa kích hoạt → huỷ link kích hoạt cũ, gửi link đặt mật khẩu, không ghi đè mật khẩu', async () => {
    const oldVerifyToken = await registerAndCaptureToken();
    const spy = vi.spyOn(emailService, 'sendSetPasswordEmail');

    const res = await request(app)
      .post(REGISTER_URL)
      .send({ ...NEW_ACCOUNT, password: 'mat-khau-ke-gian' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Vui lòng kiểm tra email để hoàn tất đăng ký');

    const { token, expiresInMinutes } = spy.mock.calls[0][0];
    expect(expiresInMinutes).toBe(60);
    expect(
      await EmailToken.exists({
        tokenHash: hashToken(token),
        type: EMAIL_TOKEN_TYPES.RESET_PASSWORD,
      }),
    ).toBeTruthy();

    // Link kích hoạt cũ (có thể do kẻ gian tạo) không còn dùng được.
    await request(app).post(VERIFY_URL).send({ token: oldVerifyToken }).expect(400);

    const user = await User.findOne({ email: NEW_ACCOUNT.email }).select('+passwordHash');
    expect(await verifyPassword('mat-khau-ke-gian', user.passwordHash)).toBe(false);
  });
});

describe('[bai-03] POST /auth/verify-email — xác thực email', () => {
  it('token hợp lệ → kích hoạt tài khoản, gửi email chào mừng', async () => {
    const token = await registerAndCaptureToken();
    const welcomeSpy = vi.spyOn(emailService, 'sendWelcomeEmail');

    const res = await request(app).post(VERIFY_URL).send({ token });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Xác thực email thành công, tài khoản đã được kích hoạt');
    expect((await User.findOne({ email: NEW_ACCOUNT.email })).emailVerifiedAt).toBeInstanceOf(Date);
    expect(welcomeSpy).toHaveBeenCalledOnce();
  });

  it('token chỉ dùng được 1 lần', async () => {
    const token = await registerAndCaptureToken();
    await request(app).post(VERIFY_URL).send({ token }).expect(200);

    const res = await request(app).post(VERIFY_URL).send({ token });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('2 request cùng lúc với cùng token → đúng 1 request thành công', async () => {
    const token = await registerAndCaptureToken();

    const responses = await Promise.all([
      request(app).post(VERIFY_URL).send({ token }),
      request(app).post(VERIFY_URL).send({ token }),
    ]);

    expect(responses.map((res) => res.status).sort()).toEqual([200, 400]);
  });

  it('token hết hạn → 400 TOKEN_INVALID', async () => {
    const token = await registerAndCaptureToken();
    await EmailToken.updateOne(
      { tokenHash: hashToken(token) },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    const res = await request(app).post(VERIFY_URL).send({ token });

    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('token sai hoặc token loại khác (đặt mật khẩu) không kích hoạt được', async () => {
    await registerAndCaptureToken();
    const resetSpy = vi.spyOn(emailService, 'sendSetPasswordEmail');
    await request(app).post(REGISTER_URL).send(NEW_ACCOUNT).expect(200);
    const resetToken = resetSpy.mock.calls[0][0].token;

    for (const token of ['token-khong-ton-tai', resetToken]) {
      const res = await request(app).post(VERIFY_URL).send({ token });
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    }
  });

  it('thiếu token → 400 VALIDATION_ERROR', async () => {
    const res = await request(app).post(VERIFY_URL).send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('[bai-03] POST /auth/resend-verification — gửi lại email xác thực', () => {
  const RESEND_MESSAGE =
    'Nếu email thuộc một tài khoản chưa kích hoạt, chúng tôi đã gửi lại liên kết';

  it('tài khoản chưa kích hoạt → gửi token mới, token cũ hết hiệu lực', async () => {
    const oldToken = await registerAndCaptureToken();
    const spy = vi.spyOn(emailService, 'sendVerifyEmail');

    const res = await request(app).post(RESEND_URL).send({ email: NEW_ACCOUNT.email });

    expect(res.body.message).toBe(RESEND_MESSAGE);
    const newToken = spy.mock.calls.at(-1)[0].token;
    expect(newToken).not.toBe(oldToken);
    await request(app).post(VERIFY_URL).send({ token: oldToken }).expect(400);
    await request(app).post(VERIFY_URL).send({ token: newToken }).expect(200);
  });

  it('email không tồn tại hoặc đã kích hoạt → cùng response, không gửi email', async () => {
    await createUser({ email: 'da-kich-hoat@example.com' });
    const spy = vi.spyOn(emailService, 'sendVerifyEmail');

    for (const email of ['khong-ton-tai@example.com', 'da-kich-hoat@example.com']) {
      const res = await request(app).post(RESEND_URL).send({ email });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe(RESEND_MESSAGE);
    }
    expect(spy).not.toHaveBeenCalled();
  });
});
