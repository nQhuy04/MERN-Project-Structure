import { EMAIL_PROVIDERS, env } from '../../shared/config/env.js';
import { features } from '../../shared/config/features.js';
import { z } from '../../shared/lib/zod.js';

/** Tên key dùng trong code (tránh gõ chuỗi rải rác). */
export const SETTING_KEYS = Object.freeze({
  REGISTRATION_ENABLED: 'auth.registrationEnabled',
  MAGIC_LINK_ENABLED: 'auth.magicLinkEnabled',
  EMAIL_PROVIDER: 'email.provider',
});

const EMAIL_PROVIDER_LABELS = {
  [EMAIL_PROVIDERS.CONSOLE]: 'Console — chỉ in email ra log server, không gửi thật',
  [EMAIL_PROVIDERS.RESEND]: 'Resend — HTTP API, cần domain đã xác minh',
  [EMAIL_PROVIDERS.SMTP]: 'SMTP (Nodemailer) — Gmail, không cần domain',
};

/**
 * Nơi DUY NHẤT khai báo system setting. Thêm setting mới = thêm một mục ở đây (không cần
 * migration): giá trị chưa lưu trong DB hoặc lưu sai kiểu → dùng `default`.
 *
 * @typedef {Object} SettingDefinition
 * @property {Object} schema Zod schema kiểm tra giá trị
 * @property {*} default giá trị mặc định
 * @property {boolean} isPublic true = trả về cho mọi người qua GET /settings/public
 * @property {string} input kiểu ô nhập ở trang quản trị ('boolean' | 'select')
 * @property {Function} [options] chỉ với 'select': `() => [{ value, label, disabled }]` — gọi lúc
 * trả về cho trang quản trị (lựa chọn có thể phụ thuộc cấu hình môi trường)
 * @property {string} label
 * @property {string} description
 */

/** @type {Object} key → SettingDefinition */
export const SETTING_DEFINITIONS = Object.freeze({
  [SETTING_KEYS.REGISTRATION_ENABLED]: {
    schema: z.boolean(),
    default: true,
    isPublic: true,
    input: 'boolean',
    label: 'Cho phép đăng ký tài khoản mới',
    description: 'Tắt: ẩn trang đăng ký và chặn tạo tài khoản mới (kể cả qua Google).',
  },
  [SETTING_KEYS.MAGIC_LINK_ENABLED]: {
    schema: z.boolean(),
    default: true,
    isPublic: true,
    input: 'boolean',
    label: 'Đăng nhập bằng liên kết email (magic link)',
    description: 'Tắt: ẩn lựa chọn này ở trang đăng nhập; các liên kết đã gửi cũng hết hiệu lực.',
  },
  [SETTING_KEYS.EMAIL_PROVIDER]: {
    // Kênh chưa cấu hình biến môi trường → 400 khi lưu. Giá trị đã lưu mà sau đó bị gỡ biến môi
    // trường → không qua schema → tự dùng kênh mặc định (EMAIL_DELIVERY).
    schema: z
      .enum(Object.values(EMAIL_PROVIDERS))
      .refine(
        (provider) => features.isEmailProviderAvailable(provider),
        'Kênh gửi này chưa được cấu hình biến môi trường trên server',
      ),
    default: env.EMAIL_DELIVERY,
    isPublic: false,
    input: 'select',
    options: () =>
      Object.values(EMAIL_PROVIDERS).map((provider) => ({
        value: provider,
        label: EMAIL_PROVIDER_LABELS[provider],
        disabled: !features.isEmailProviderAvailable(provider),
      })),
    label: 'Kênh gửi email',
    description:
      'Áp dụng cho mọi email của hệ thống. Lựa chọn bị mờ = server chưa cấu hình biến môi trường của kênh đó (docs/05). Đổi kênh xong nên bấm "Gửi email thử".',
  },
});
