import { env } from '../config/env.js';

export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/** Cookie refresh chỉ được gửi kèm request tới nhóm route auth (refresh, logout). */
export const REFRESH_TOKEN_COOKIE_PATH = '/api/v1/auth';

export const REFRESH_TOKEN_TTL_DAYS = 30;
const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

function baseCookieOptions() {
  return {
    httpOnly: true, // JavaScript phía trình duyệt không đọc được → XSS không lấy được token
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: REFRESH_TOKEN_COOKIE_PATH,
  };
}

/**
 * Đặt cookie chứa refresh token.
 * @param {Object} res Express response
 * @param {string} refreshToken dạng `<sessionId>.<secret>`
 */
export function setRefreshTokenCookie(res, refreshToken) {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...baseCookieOptions(),
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

/**
 * Xoá cookie refresh token (phải cùng path/sameSite/secure với lúc đặt).
 * @param {Object} res Express response
 */
export function clearRefreshTokenCookie(res) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions());
}

export const OAUTH_STATE_COOKIE = 'oauth_google';
const OAUTH_STATE_COOKIE_PATH = '/api/v1/auth/google';
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function oauthStateCookieOptions() {
  // SameSite=Lax: cookie vẫn được gửi khi Google chuyển hướng (điều hướng top-level) về callback.
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax',
    path: OAUTH_STATE_COOKIE_PATH,
  };
}

/**
 * Cookie tạm (10 phút) giữ `state` + `codeVerifier` giữa lúc chuyển sang Google và lúc quay về.
 * @param {Object} res Express response
 * @param {Object} value `{ state, codeVerifier }`
 */
export function setOAuthStateCookie(res, { state, codeVerifier }) {
  res.cookie(OAUTH_STATE_COOKIE, `${state}.${codeVerifier}`, {
    ...oauthStateCookieOptions(),
    maxAge: OAUTH_STATE_TTL_MS,
  });
}

/** @param {Object} res Express response */
export function clearOAuthStateCookie(res) {
  res.clearCookie(OAUTH_STATE_COOKIE, oauthStateCookieOptions());
}
