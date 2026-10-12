import { randomUUID } from 'node:crypto';
import { User } from '../../src/modules/users/users.model.js';
import { hashPassword } from '../../src/shared/utils/password.js';

export const DEFAULT_PASSWORD = 'mat-khau-an-toan';

// Hash bcrypt chậm có chủ đích → chỉ hash mật khẩu mặc định một lần cho cả file test.
let defaultPasswordHash;

/**
 * Tạo user trực tiếp trong DB test (mặc định: MEMBER, đã kích hoạt, mật khẩu DEFAULT_PASSWORD).
 * @param {Object} [overrides] ghi đè trường của user; `password` để đặt mật khẩu khác
 * @returns {Promise} resolve user vừa tạo
 */
export async function createUser(overrides = {}) {
  const { password, ...fields } = overrides;
  defaultPasswordHash ??= await hashPassword(DEFAULT_PASSWORD);

  return User.create({
    email: `user-${randomUUID()}@example.com`,
    name: 'Người dùng thử',
    passwordHash: password ? await hashPassword(password) : defaultPasswordHash,
    emailVerifiedAt: new Date(),
    ...fields,
  });
}
