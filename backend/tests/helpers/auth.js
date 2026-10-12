import { sessionsService } from '../../src/modules/sessions/sessions.service.js';
import { signAccessToken } from '../../src/shared/utils/token.js';

/**
 * Tạo phiên đăng nhập cho user trong DB test (nhanh hơn gọi POST /auth/login).
 * @param {Object} user
 * @returns {Promise} resolve `{ accessToken, refreshToken, session, authHeader }`
 */
export async function signIn(user) {
  const { session, refreshToken } = await sessionsService.create({
    userId: user._id,
    userAgent: 'Vitest',
  });
  const accessToken = signAccessToken({ userId: user._id, sessionId: session._id });

  return { accessToken, refreshToken, session, authHeader: `Bearer ${accessToken}` };
}
