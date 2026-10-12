import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { emailService } from '../../src/modules/email/email.service.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { Setting } from '../../src/modules/settings/settings.model.js';
import { User } from '../../src/modules/users/users.model.js';
import { features } from '../../src/shared/config/features.js';
import { googleOAuth } from '../../src/shared/lib/googleOAuth.js';
import { mailer } from '../../src/shared/lib/mailer.js';
import { createUser } from '../helpers/factories.js';

const START_URL = '/api/v1/auth/google';
const CALLBACK_URL = '/api/v1/auth/google/callback';
const FRONTEND_CALLBACK = 'http://localhost:5173/auth/callback';
const STATE = 'state-ngau-nhien';
// codeVerifier của Google có thể chứa dấu chấm — cookie phải tách đúng.
const CODE_VERIFIER = 'verifier.co.dau.cham';
const PROFILE = {
  googleId: 'google-sub-1',
  email: 'an@gmail.com',
  emailVerified: true,
  name: 'Nguyễn An',
};

function mockGoogle(profile = PROFILE) {
  vi.spyOn(googleOAuth, 'createAuthorizationRequest').mockResolvedValue({
    url: 'https://accounts.google.com/o/oauth2/v2/auth?mock=1',
    state: STATE,
    codeVerifier: CODE_VERIFIER,
  });
  return vi.spyOn(googleOAuth, 'exchangeCode').mockResolvedValue(profile);
}

/** Gọi callback như trình duyệt quay về từ Google (kèm cookie tạm đã đặt ở bước bắt đầu). */
function callback(query, { cookieState = STATE } = {}) {
  const req = request(app).get(CALLBACK_URL).query(query);
  return cookieState === null
    ? req
    : req.set('Cookie', `oauth_google=${cookieState}.${CODE_VERIFIER}`);
}

function getCookie(res, name) {
  return (res.headers['set-cookie'] ?? []).find((cookie) => cookie.startsWith(`${name}=`));
}

function errorOf(res) {
  return new URL(res.headers.location).searchParams.get('error');
}

afterEach(async () => {
  vi.restoreAllMocks();
  await mailer.waitForPending();
  await Promise.all([User.deleteMany({}), Session.deleteMany({}), Setting.deleteMany({})]);
});

describe('[bai-10] GET /auth/google — bắt đầu đăng nhập Google', () => {
  it('chuyển sang Google, lưu state + code verifier vào cookie tạm httpOnly (SameSite=Lax)', async () => {
    mockGoogle();

    const res = await request(app).get(START_URL);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://accounts.google.com/o/oauth2/v2/auth?mock=1');
    const cookie = getCookie(res, 'oauth_google');
    expect(cookie).toContain(encodeURIComponent(`${STATE}.${CODE_VERIFIER}`));
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth\/google/);
  });

  it('chưa cấu hình GOOGLE_* → 404 FEATURE_NOT_CONFIGURED', async () => {
    vi.spyOn(features, 'isGoogleOAuthEnabled').mockReturnValue(false);

    const res = await request(app).get(START_URL);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('FEATURE_NOT_CONFIGURED');
  });
});

describe('[bai-10] GET /auth/google/callback — Google chuyển về', () => {
  it('người mới → tạo tài khoản đã kích hoạt, không mật khẩu; đặt cookie refresh; về /auth/callback', async () => {
    const exchangeSpy = mockGoogle();
    const welcomeSpy = vi.spyOn(emailService, 'sendWelcomeEmail');

    const res = await callback({ code: 'code-1', state: STATE });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(FRONTEND_CALLBACK);
    expect(exchangeSpy).toHaveBeenCalledWith({ code: 'code-1', codeVerifier: CODE_VERIFIER });
    expect(getCookie(res, 'refresh_token')).toMatch(/HttpOnly/);
    expect(getCookie(res, 'oauth_google')).toMatch(/oauth_google=;/);

    const user = await User.findOne({ email: 'an@gmail.com' }).select('+passwordHash +googleId');
    expect(user).toMatchObject({ name: 'Nguyễn An', googleId: 'google-sub-1', role: 'MEMBER' });
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(user.passwordHash).toBeUndefined();
    expect(welcomeSpy).toHaveBeenCalledOnce();
  });

  it('đã liên kết (tìm theo googleId) → đăng nhập đúng tài khoản dù email Google đã đổi', async () => {
    const existing = await createUser({ email: 'cu@example.com', googleId: 'google-sub-1' });
    mockGoogle({ ...PROFILE, email: 'moi@gmail.com' });

    await callback({ code: 'c', state: STATE });

    expect(await User.countDocuments()).toBe(1);
    expect(await Session.exists({ userId: existing._id })).toBeTruthy();
  });

  it('email trùng tài khoản local ĐÃ kích hoạt → liên kết, giữ mật khẩu', async () => {
    const existing = await createUser({ email: 'an@gmail.com' });
    mockGoogle();

    await callback({ code: 'c', state: STATE });

    const user = await User.findById(existing._id).select('+passwordHash +googleId');
    expect(user.googleId).toBe('google-sub-1');
    expect(user.passwordHash).toBeTruthy();
    expect(await User.countDocuments()).toBe(1);
  });

  it('email trùng tài khoản local CHƯA kích hoạt → kích hoạt + XOÁ mật khẩu cũ (chống chiếm trước)', async () => {
    const existing = await createUser({ email: 'an@gmail.com', emailVerifiedAt: null });
    mockGoogle();

    await callback({ code: 'c', state: STATE });

    const user = await User.findById(existing._id).select('+passwordHash');
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(user.passwordHash).toBeUndefined();
  });

  it.each([
    ['state không khớp cookie', { code: 'c', state: 'state-cua-ke-gian' }, {}],
    ['không có cookie tạm', { code: 'c', state: STATE }, { cookieState: null }],
    ['thiếu code', { state: STATE }, {}],
  ])(
    '%s → về /auth/callback?error=OAUTH_STATE_INVALID, không gọi Google',
    async (_l, query, options) => {
      const exchangeSpy = mockGoogle();

      const res = await callback(query, options);

      expect(errorOf(res)).toBe('OAUTH_STATE_INVALID');
      expect(exchangeSpy).not.toHaveBeenCalled();
      expect(getCookie(res, 'refresh_token')).toBeUndefined();
    },
  );

  it('người dùng huỷ ở Google (?error=access_denied) → OAUTH_CANCELLED', async () => {
    mockGoogle();

    const res = await callback({ error: 'access_denied' });

    expect(errorOf(res)).toBe('OAUTH_CANCELLED');
  });

  it('Google chưa xác minh email → OAUTH_EMAIL_NOT_VERIFIED, không tạo tài khoản', async () => {
    mockGoogle({ ...PROFILE, emailVerified: false });

    const res = await callback({ code: 'c', state: STATE });

    expect(errorOf(res)).toBe('OAUTH_EMAIL_NOT_VERIFIED');
    expect(await User.countDocuments()).toBe(0);
  });

  it('tắt đăng ký → người mới bị chặn (REGISTRATION_DISABLED), người đã có tài khoản vẫn vào', async () => {
    await Setting.create({ key: 'auth.registrationEnabled', value: false });
    mockGoogle();

    const blocked = await callback({ code: 'c', state: STATE });
    expect(errorOf(blocked)).toBe('REGISTRATION_DISABLED');

    await createUser({ email: 'an@gmail.com' });
    const allowed = await callback({ code: 'c', state: STATE });
    expect(allowed.headers.location).toBe(FRONTEND_CALLBACK);
  });

  it('tài khoản bị khoá → ACCOUNT_LOCKED', async () => {
    await createUser({ email: 'an@gmail.com', lockedAt: new Date() });
    mockGoogle();

    const res = await callback({ code: 'c', state: STATE });

    expect(errorOf(res)).toBe('ACCOUNT_LOCKED');
  });

  it('lỗi khi gọi Google (code hết hạn...) → OAUTH_FAILED, không lộ chi tiết', async () => {
    mockGoogle().mockRejectedValue(new Error('invalid_grant: chi tiết nội bộ'));

    const res = await callback({ code: 'c', state: STATE });

    expect(errorOf(res)).toBe('OAUTH_FAILED');
    expect(res.headers.location).not.toContain('invalid_grant');
  });
});
