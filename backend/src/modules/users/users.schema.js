import { z } from '../../shared/lib/zod.js';
import { MAX_PASSWORD_BYTES, getPasswordByteLength } from '../../shared/utils/password.js';
import { USER_NAME_MAX_LENGTH } from './users.constants.js';

export const PASSWORD_MIN_LENGTH = 8;

// Khớp với ràng buộc trong users.model.js (Zod ở biên API, Mongoose giữ toàn vẹn dữ liệu).
const EMAIL_MAX_LENGTH = 254;

/** Email: bỏ khoảng trắng, chuyển chữ thường rồi mới kiểm tra định dạng. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, 'Email quá dài')
  .pipe(z.email('Email không hợp lệ'));

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Tên là bắt buộc')
  .max(USER_NAME_MAX_LENGTH, `Tên tối đa ${USER_NAME_MAX_LENGTH} ký tự`);

/** Mật khẩu: ≥ 8 ký tự và ≤ 72 byte UTF-8 (giới hạn của bcrypt). */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mật khẩu tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`)
  .refine(
    (password) => getPasswordByteLength(password) <= MAX_PASSWORD_BYTES,
    'Mật khẩu quá dài (tối đa 72 byte — chữ có dấu tính 2–3 byte)',
  );

export const updateMeBodySchema = z.object({ name: nameSchema });
