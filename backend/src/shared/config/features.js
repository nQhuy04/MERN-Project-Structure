import { EMAIL_PROVIDERS, env } from './env.js';

/**
 * Tính năng tuỳ chọn bật/tắt theo biến môi trường (đủ biến cấu hình = bật). Export dạng object
 * để test giả lập trạng thái tắt bằng `vi.spyOn(features, ...)`.
 */
export const features = {
  /** @returns {boolean} */
  isGoogleOAuthEnabled: () => env.GOOGLE_OAUTH_ENABLED,
  /** @returns {boolean} */
  isStorageEnabled: () => env.STORAGE_ENABLED,
  /**
   * Kênh gửi email dùng được với biến môi trường hiện tại. `console` không có ở production
   * (trừ khi chủ động đặt `EMAIL_DELIVERY=console`): email chứa link đăng nhập / đặt lại mật
   * khẩu, in ra log production là lộ token.
   * @param {string} provider một giá trị trong EMAIL_PROVIDERS
   * @returns {boolean}
   */
  isEmailProviderAvailable: (provider) => {
    switch (provider) {
      case EMAIL_PROVIDERS.CONSOLE:
        return !env.IS_PRODUCTION || env.EMAIL_DELIVERY === EMAIL_PROVIDERS.CONSOLE;
      case EMAIL_PROVIDERS.RESEND:
        return env.RESEND_ENABLED;
      case EMAIL_PROVIDERS.SMTP:
        return env.SMTP_ENABLED;
      default:
        return false;
    }
  },
  /**
   * Cờ tính năng cho frontend (GET /settings/public) để ẩn nút tương ứng.
   * @returns {Object} `{ googleOAuth, storage }`
   */
  getFlags: () => ({
    googleOAuth: features.isGoogleOAuthEnabled(),
    storage: features.isStorageEnabled(),
  }),
};
