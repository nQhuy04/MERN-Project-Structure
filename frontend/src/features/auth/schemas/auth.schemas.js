import { z } from '@/shared/lib/zod';

/**
 * Schema form của feature auth. Quy tắc khớp với backend (users.schema.js) — frontend validate
 * để phản hồi nhanh, backend vẫn là nơi kiểm tra cuối cùng.
 */

export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;
const NAME_MAX_LENGTH = 100;

const textEncoder = new TextEncoder();

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập email')
  .pipe(z.email('Email không hợp lệ'));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mật khẩu tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`)
  .refine(
    (password) => textEncoder.encode(password).length <= PASSWORD_MAX_BYTES,
    'Mật khẩu quá dài (tối đa 72 byte — chữ có dấu tính 2–3 byte)',
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

/**
 * **[BÀI 02]** Schema của form đăng ký — 4 ô: `name`, `email`, `password`, `confirmPassword`.
 *
 * TODO(bai-02): viết lại schema này cho đủ quy tắc.
 * 1. `name`: chuỗi, `.trim()`, bắt buộc (`'Vui lòng nhập tên'`), tối đa `NAME_MAX_LENGTH` ký tự.
 * 2. `email`: dùng lại `emailSchema` ở trên.
 * 3. `password`: dùng lại `passwordSchema` ở trên.
 * 4. `confirmPassword`: chuỗi, bắt buộc (`'Vui lòng nhập lại mật khẩu'`).
 * 5. Thêm `.refine(...)` so `password` với `confirmPassword`; lỗi phải gắn vào ô nhập lại
 *    (`path: ['confirmPassword']`, message `'Mật khẩu nhập lại không khớp'`) — nếu không, thông
 *    báo hiện sai ô. Xem `newPasswordSchema` bên dưới làm mẫu.
 *
 * Quy tắc phải KHỚP với `users.schema.js` của backend. Frontend validate để báo lỗi ngay khi gõ;
 * backend vẫn là chốt chặn cuối (ai cũng gọi thẳng API bằng curl được).
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên')
      .max(NAME_MAX_LENGTH, `Tên quá dài (tối đa ${NAME_MAX_LENGTH} ký tự)`),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

/** Mật khẩu mới + nhập lại (dùng cho đặt lại và đổi mật khẩu). */
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });

// Tên trường trùng với API (`newPassword`) để lỗi theo trường từ server gắn thẳng vào ô.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại không khớp',
  });
