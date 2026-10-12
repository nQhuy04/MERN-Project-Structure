import { z } from '../../shared/lib/zod.js';
import { emailSchema, nameSchema, passwordSchema } from '../users/users.schema.js';

// Token base64url 32 byte dài 43 ký tự; giới hạn trên để chặn chuỗi rác quá dài.
const emailTokenSchema = z.string().trim().min(1, 'Thiếu token').max(200, 'Token không hợp lệ');

export const registerBodySchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
});

export const verifyEmailBodySchema = z.object({ token: emailTokenSchema });

export const resendVerificationBodySchema = z.object({ email: emailSchema });

// Đăng nhập không áp quy tắc độ dài mật khẩu (mật khẩu cũ có thể theo quy tắc cũ); chỉ chặn
// giá trị rỗng / quá dài để không tốn bcrypt vô ích.
export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu').max(200, 'Mật khẩu không hợp lệ'),
});

export const forgotPasswordBodySchema = z.object({ email: emailSchema });

export const resetPasswordBodySchema = z.object({
  token: emailTokenSchema,
  password: passwordSchema,
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại').max(200),
  newPassword: passwordSchema,
});

export const magicLinkBodySchema = z.object({ email: emailSchema });

export const magicLinkVerifyBodySchema = z.object({ token: emailTokenSchema });

/** Query Google gửi về callback: thành công có code + state, người dùng huỷ có error. */
export const googleCallbackQuerySchema = z.object({
  code: z.string().max(2048).optional(),
  state: z.string().max(200).optional(),
  error: z.string().max(200).optional(),
});
