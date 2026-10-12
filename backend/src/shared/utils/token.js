import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// 32 byte ngẫu nhiên = 256 bit, đủ để không thể đoán/dò.
const TOKEN_BYTES = 32;

/**
 * Sinh token ngẫu nhiên an toàn, dạng base64url (dùng được trực tiếp trong URL).
 * @returns {string}
 */
export function generateToken() {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

/**
 * Hash token để lưu DB — lộ DB cũng không dùng được token. Token đã đủ ngẫu nhiên nên
 * SHA-256 là đủ (không cần bcrypt như mật khẩu).
 * @param {string} token
 * @returns {string} hex SHA-256
 */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/** Access token sống ngắn: bị lộ thì cũng chỉ dùng được trong thời gian này. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const JWT_ALGORITHM = 'HS256';

/**
 * Ký access token. Payload chỉ chứa `sub` (userId) + `sid` (sessionId) — role và trạng thái
 * user luôn đọc từ DB mỗi request để thay đổi có hiệu lực ngay.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.sessionId
 * @returns {string} JWT
 */
export function signAccessToken({ userId, sessionId }) {
  return jwt.sign({ sid: String(sessionId) }, env.JWT_ACCESS_SECRET, {
    algorithm: JWT_ALGORITHM,
    subject: String(userId),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

/**
 * Xác minh access token (chữ ký + hạn), chỉ chấp nhận đúng thuật toán HS256.
 * @param {string} token
 * @returns {Object} payload `{ sub, sid, iat, exp }`
 * @throws {Error} jwt.TokenExpiredError / jwt.JsonWebTokenError
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: [JWT_ALGORITHM] });
}

/**
 * So sánh hai chuỗi bí mật với thời gian không phụ thuộc vị trí ký tự khác nhau đầu tiên (chống
 * dò bí mật qua thời gian phản hồi). So sánh hash SHA-256 để hai phía luôn cùng độ dài.
 * @param {string} actual
 * @param {string} expected
 * @returns {boolean}
 */
export function safeEqual(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false;
  const actualHash = createHash('sha256').update(actual).digest();
  const expectedHash = createHash('sha256').update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}
