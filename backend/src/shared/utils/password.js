import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

/** bcrypt chỉ dùng 72 byte đầu và bỏ qua phần còn lại một cách im lặng → phải chặn trước. */
export const MAX_PASSWORD_BYTES = 72;

/**
 * Số byte UTF-8 của mật khẩu (ký tự tiếng Việt có dấu chiếm 2–3 byte).
 * @param {string} password
 * @returns {number}
 */
export function getPasswordByteLength(password) {
  return Buffer.byteLength(password, 'utf8');
}

/**
 * Hash mật khẩu bằng bcrypt với cost từ env (≥ 10).
 * @param {string} password mật khẩu đã qua validate (≤ 72 byte)
 * @returns {Promise} resolve chuỗi hash
 * @throws {Error} khi mật khẩu vượt 72 byte (lỗi lập trình: thiếu validate ở biên API)
 */
export async function hashPassword(password) {
  if (getPasswordByteLength(password) > MAX_PASSWORD_BYTES) {
    throw new Error(`Mật khẩu vượt quá ${MAX_PASSWORD_BYTES} byte, phải được chặn khi validate`);
  }
  return bcrypt.hash(password, env.BCRYPT_COST);
}

/**
 * So sánh mật khẩu với hash (thời gian so sánh không phụ thuộc nội dung).
 * @param {string} password
 * @param {string} passwordHash
 * @returns {Promise} resolve `true` nếu khớp
 */
export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

let dummyPasswordHashPromise;

/**
 * Hash của một mật khẩu ngẫu nhiên, cùng cost với hash thật. Khi đăng nhập bằng email không
 * tồn tại vẫn so sánh với hash này để thời gian phản hồi như khi email tồn tại (chống dò email
 * bằng thời gian). Tính lười ở lần dùng đầu, không tính lúc nạp module.
 * @returns {Promise} resolve chuỗi hash
 */
export function getDummyPasswordHash() {
  dummyPasswordHashPromise ??= bcrypt.hash(randomUUID(), env.BCRYPT_COST);
  return dummyPasswordHashPromise;
}
