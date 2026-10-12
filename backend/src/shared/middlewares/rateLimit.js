import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

const MINUTE_MS = 60 * 1000;

/**
 * Tạo middleware giới hạn số request theo IP (IP thật lấy qua `trust proxy`), hoặc theo khoá
 * khác nếu truyền `keyGenerator`.
 * Bộ đếm nằm trong bộ nhớ tiến trình: chạy nhiều instance thì mỗi instance đếm riêng —
 * cần store dùng chung (Redis...) khi scale ngang.
 * @param {Object} options
 * @param {number} options.windowMs khoảng thời gian đếm
 * @param {number} options.limit số request tối đa trong khoảng đó
 * @param {Function} [options.keyGenerator] `(req) => string` — khoá đếm; mặc định là IP
 * @param {boolean} [options.enabled] mặc định theo env RATE_LIMIT_ENABLED (test tắt)
 * @returns {Function} Express middleware; vượt giới hạn → 429 RATE_LIMITED
 */
export function createRateLimiter({
  windowMs,
  limit,
  keyGenerator,
  enabled = env.RATE_LIMIT_ENABLED,
}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    skip: () => !enabled,
    handler: (_req, _res, next) =>
      next(
        new AppError({
          statusCode: 429,
          code: ERROR_CODES.RATE_LIMITED,
          message: 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau ít phút',
        }),
      ),
  });
}

/** Route auth gửi email (đăng ký, gửi lại email...): 20 lần / 15 phút / IP. */
export const authRateLimiter = createRateLimiter({ windowMs: 15 * MINUTE_MS, limit: 20 });

/** Đăng nhập (chống dò mật khẩu): 10 lần / 15 phút / IP. */
export const loginRateLimiter = createRateLimiter({ windowMs: 15 * MINUTE_MS, limit: 10 });

/**
 * Đổi mật khẩu khi đang đăng nhập: 5 lần / 15 phút / **user**.
 * Đếm theo userId chứ không theo IP: kẻ có access token bị lộ cần mật khẩu hiện tại để đổi, và
 * có thể đổi IP để né hạn mức theo IP. Phải đặt SAU `authenticate` (cần `req.auth`).
 */
export const changePasswordRateLimiter = createRateLimiter({
  windowMs: 15 * MINUTE_MS,
  limit: 5,
  keyGenerator: (req) => String(req.auth.userId),
});

/**
 * Xin URL upload (file cá nhân, ảnh đại diện, thư viện ảnh): 30 lần / 15 phút / **user**.
 * Mỗi lần gọi tạo một bản ghi PENDING và một URL ký → phải chặn theo tài khoản, không theo IP.
 * Phải đặt SAU `authenticate` (cần `req.auth`).
 */
export const presignRateLimiter = createRateLimiter({
  windowMs: 15 * MINUTE_MS,
  limit: 30,
  keyGenerator: (req) => String(req.auth.userId),
});

/**
 * Gửi email thử ở trang Cấu hình: 5 lần / 15 phút / user — mỗi lần là một email thật tốn hạn
 * mức của nhà cung cấp. Đặt SAU `authenticate`.
 */
export const testEmailRateLimiter = createRateLimiter({
  windowMs: 15 * MINUTE_MS,
  limit: 5,
  keyGenerator: (req) => String(req.auth.userId),
});
