import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { User } from '../../src/modules/users/users.model.js';
import { hashToken, verifyAccessToken } from '../../src/shared/utils/token.js';
import { DEFAULT_PASSWORD, createUser } from '../helpers/factories.js';

const LOGIN_URL = '/api/v1/auth/login';
const INVALID_CREDENTIALS = {
  success: false,
  error: { code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng' },
};

function login(body) {
  return request(app).post(LOGIN_URL).set('User-Agent', 'Vitest Browser').send(body);
}

/** Tách cookie refresh token từ header Set-Cookie. */
function getRefreshCookie(res) {
  return (res.headers['set-cookie'] ?? []).find((cookie) => cookie.startsWith('refresh_token='));
}

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
});

describe('[bai-04] POST /auth/login — đăng nhập', () => {
  it('đúng email + mật khẩu → access token (chỉ sub + sid), user không lộ passwordHash', async () => {
    const user = await createUser({ email: 'an@example.com' });

    const res = await login({ email: 'AN@example.com ', password: DEFAULT_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Đăng nhập thành công');
    const { accessToken, user: returnedUser } = res.body.data;
    expect(returnedUser).toMatchObject({ id: String(user._id), email: 'an@example.com' });
    expect(returnedUser).not.toHaveProperty('passwordHash');
    expect(returnedUser).not.toHaveProperty('_id');
    expect(Date.parse(returnedUser.lastLoginAt)).not.toBeNaN();

    const payload = verifyAccessToken(accessToken);
    expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sid', 'sub']);
    expect(payload.sub).toBe(String(user._id));
    expect(payload.exp - payload.iat).toBe(15 * 60);
  });

  it('tạo session (lưu hash của secret, user-agent) và đặt cookie refresh httpOnly đúng path', async () => {
    const user = await createUser();

    const res = await login({ email: user.email, password: DEFAULT_PASSWORD });

    const cookie = getRefreshCookie(res);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Max-Age=2592000/);

    const refreshToken = decodeURIComponent(cookie.split(';')[0].split('=')[1]);
    const [sessionId, secret] = refreshToken.split('.');
    const session = await Session.findById(sessionId).select('+secretHash');
    expect(session).toMatchObject({ userAgent: 'Vitest Browser' });
    expect(String(session.userId)).toBe(String(user._id));
    expect(session.secretHash).toBe(hashToken(secret));
    expect(verifyAccessToken(res.body.data.accessToken).sid).toBe(sessionId);
    expect((await User.findById(user._id)).lastLoginAt).toBeInstanceOf(Date);
  });

  it('sai mật khẩu và email không tồn tại → cùng một lỗi, không tạo session', async () => {
    const user = await createUser();

    const wrongPassword = await login({ email: user.email, password: 'sai-mat-khau' });
    const unknownEmail = await login({ email: 'khong-co@example.com', password: DEFAULT_PASSWORD });

    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(400);
      expect(res.body).toEqual(INVALID_CREDENTIALS);
      expect(getRefreshCookie(res)).toBeUndefined();
    }
    expect(await Session.countDocuments()).toBe(0);
  });

  it('tài khoản chưa kích hoạt: chỉ báo EMAIL_NOT_VERIFIED khi mật khẩu đúng', async () => {
    const user = await createUser({ emailVerifiedAt: null });

    const wrong = await login({ email: user.email, password: 'sai-mat-khau' });
    const right = await login({ email: user.email, password: DEFAULT_PASSWORD });

    expect(wrong.body).toEqual(INVALID_CREDENTIALS);
    expect(right.status).toBe(403);
    expect(right.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    expect(await Session.countDocuments()).toBe(0);
  });

  it('tài khoản bị khoá: chỉ báo ACCOUNT_LOCKED khi mật khẩu đúng', async () => {
    const user = await createUser({ lockedAt: new Date() });

    const wrong = await login({ email: user.email, password: 'sai-mat-khau' });
    const right = await login({ email: user.email, password: DEFAULT_PASSWORD });

    expect(wrong.body).toEqual(INVALID_CREDENTIALS);
    expect(right.status).toBe(403);
    expect(right.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  it('tài khoản chỉ dùng Google (chưa có mật khẩu) → INVALID_CREDENTIALS', async () => {
    const user = await createUser({ passwordHash: undefined, googleId: 'google-1' });

    const res = await login({ email: user.email, password: DEFAULT_PASSWORD });

    expect(res.body).toEqual(INVALID_CREDENTIALS);
  });

  it('chặn NoSQL operator injection ở email/mật khẩu', async () => {
    await createUser();

    const res = await login({ email: { $ne: null }, password: { $ne: null } });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
