import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { REFRESH_REUSE_GRACE_MS } from '../../src/modules/sessions/sessions.service.js';
import { User } from '../../src/modules/users/users.model.js';
import { verifyAccessToken } from '../../src/shared/utils/token.js';
import { signIn } from '../helpers/auth.js';
import { createUser } from '../helpers/factories.js';

const REFRESH_URL = '/api/v1/auth/refresh';
const LOGOUT_URL = '/api/v1/auth/logout';

function refresh(refreshToken, { withXhrHeader = true } = {}) {
  const req = request(app).post(REFRESH_URL);
  if (withXhrHeader) req.set('X-Requested-With', 'XMLHttpRequest');
  if (refreshToken) req.set('Cookie', `refresh_token=${refreshToken}`);
  return req;
}

function logout(refreshToken) {
  const req = request(app).post(LOGOUT_URL).set('X-Requested-With', 'XMLHttpRequest');
  return refreshToken ? req.set('Cookie', `refresh_token=${refreshToken}`) : req;
}

/** Giá trị cookie refresh_token trong response (undefined nếu không đặt). */
function getRefreshCookie(res) {
  return (res.headers['set-cookie'] ?? []).find((cookie) => cookie.startsWith('refresh_token='));
}

function readCookieValue(cookie) {
  return decodeURIComponent(cookie.split(';')[0].split('=')[1]);
}

/** Đưa mốc rotate gần nhất về quá khứ để giả lập đã hết thời gian ân hạn. */
async function expireGracePeriod(sessionId) {
  await Session.updateOne(
    { _id: sessionId },
    { $set: { rotatedAt: new Date(Date.now() - REFRESH_REUSE_GRACE_MS - 1000) } },
  );
}

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
});

describe('[bai-06] POST /auth/refresh — xoay vòng refresh token', () => {
  it('token hợp lệ → access token mới + refresh token mới (cookie), gia hạn phiên', async () => {
    const user = await createUser();
    const { refreshToken, session } = await signIn(user);
    await Session.updateOne(
      { _id: session._id },
      { $set: { expiresAt: new Date(Date.now() + 1000) } },
    );

    const res = await refresh(refreshToken);

    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(String(user._id));
    expect(verifyAccessToken(res.body.data.accessToken).sid).toBe(String(session._id));

    const newRefreshToken = readCookieValue(getRefreshCookie(res));
    expect(newRefreshToken).not.toBe(refreshToken);
    expect(newRefreshToken.split('.')[0]).toBe(String(session._id));

    const updated = await Session.findById(session._id);
    expect(updated.expiresAt.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
    expect(updated.rotatedAt).toBeInstanceOf(Date);
  });

  it('refresh token mới dùng tiếp được (chuỗi rotate)', async () => {
    const user = await createUser();
    const { refreshToken } = await signIn(user);

    const first = await refresh(refreshToken);
    const second = await refresh(readCookieValue(getRefreshCookie(first)));

    expect(second.status).toBe(200);
  });

  it('thiếu header X-Requested-With → 403 CSRF_REJECTED', async () => {
    const user = await createUser();
    const { refreshToken } = await signIn(user);

    const res = await refresh(refreshToken, { withXhrHeader: false });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_REJECTED');
  });

  it.each([
    ['không có cookie', undefined],
    ['cookie sai định dạng', 'rac'],
    ['sessionId đúng dạng nhưng secret sai', `${'a'.repeat(24)}.${'b'.repeat(43)}`],
  ])('%s → 401 AUTH_TOKEN_INVALID và xoá cookie', async (_label, refreshToken) => {
    const res = await refresh(refreshToken);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
    expect(getRefreshCookie(res)).toMatch(/refresh_token=;/);
  });

  it('dùng lại token cũ trong 30 giây (tab khác) → vẫn cấp access token, không đặt lại cookie', async () => {
    const user = await createUser();
    const { refreshToken } = await signIn(user);
    await refresh(refreshToken).expect(200);

    const res = await refresh(refreshToken);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(getRefreshCookie(res)).toBeUndefined();
  });

  it('2 tab refresh cùng lúc bằng cùng token → cả hai thành công, chỉ 1 cookie mới', async () => {
    const user = await createUser();
    const { refreshToken } = await signIn(user);

    const responses = await Promise.all([refresh(refreshToken), refresh(refreshToken)]);

    expect(responses.map((res) => res.status)).toEqual([200, 200]);
    expect(responses.filter((res) => getRefreshCookie(res)).length).toBe(1);
  });

  it('dùng lại token cũ SAU 30 giây → coi là bị đánh cắp: thu hồi cả phiên', async () => {
    const user = await createUser();
    const { refreshToken, session } = await signIn(user);
    const rotated = await refresh(refreshToken);
    const currentToken = readCookieValue(getRefreshCookie(rotated));
    await expireGracePeriod(session._id);

    const reuse = await refresh(refreshToken);

    expect(reuse.status).toBe(401);
    expect(await Session.exists({ _id: session._id })).toBeNull();
    // Người đang giữ token mới nhất (có thể là kẻ gian) cũng mất phiên.
    expect((await refresh(currentToken)).status).toBe(401);
  });

  it('phiên hết hạn → 401', async () => {
    const user = await createUser();
    const { refreshToken, session } = await signIn(user);
    await Session.updateOne(
      { _id: session._id },
      { $set: { expiresAt: new Date(Date.now() - 1) } },
    );

    expect((await refresh(refreshToken)).status).toBe(401);
  });

  it('user bị khoá → 403 ACCOUNT_LOCKED và phiên bị thu hồi', async () => {
    const user = await createUser();
    const { refreshToken, session } = await signIn(user);
    await User.updateOne({ _id: user._id }, { $set: { lockedAt: new Date() } });

    const res = await refresh(refreshToken);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
    expect(await Session.exists({ _id: session._id })).toBeNull();
  });
});

describe('[bai-06] POST /auth/logout — đăng xuất', () => {
  it('xoá phiên + cookie; access token của phiên đó hết tác dụng ngay', async () => {
    const user = await createUser();
    const { refreshToken, authHeader, session } = await signIn(user);

    const res = await logout(refreshToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Đã đăng xuất');
    expect(getRefreshCookie(res)).toMatch(/refresh_token=;/);
    expect(await Session.exists({ _id: session._id })).toBeNull();
    expect(
      (await request(app).get('/api/v1/users/me').set('Authorization', authHeader)).status,
    ).toBe(401);
  });

  it('không có cookie → vẫn 200 (idempotent)', async () => {
    await logout().expect(200);
  });

  it('chỉ biết sessionId (secret sai) → không xoá được phiên của người khác', async () => {
    const user = await createUser();
    const { session } = await signIn(user);

    await logout(`${session._id}.${'x'.repeat(43)}`).expect(200);

    expect(await Session.exists({ _id: session._id })).toBeTruthy();
  });

  it('thiếu header X-Requested-With → 403', async () => {
    const res = await request(app).post(LOGOUT_URL);

    expect(res.status).toBe(403);
  });
});
