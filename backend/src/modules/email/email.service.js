// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 03 và bài 15.
import { createElement as h } from 'react';
import { env } from '../../shared/config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { logger } from '../../shared/lib/logger.js';
import { mailer } from '../../shared/lib/mailer.js';
import { SETTING_KEYS } from '../settings/settings.registry.js';
import { settingsService } from '../settings/settings.service.js';
import {
  AccountExistsEmail,
  AccountLockedEmail,
  AccountUnlockedEmail,
  AnnouncementEmail,
  RoleChangedEmail,
  MagicLinkEmail,
  PasswordChangedEmail,
  ResetPasswordEmail,
  SetPasswordEmail,
  TestEmail,
  VerifyEmail,
  WelcomeEmail,
} from './templates/authEmails.js';

/**
 * Nghiệp vụ gửi email: chọn template, dựng link về frontend, gọi mailer qua kênh gửi mà Super
 * Admin chọn ở trang Cấu hình. Export dạng object để test lấy token bằng `vi.spyOn(emailService, ...)`.
 */

export const APP_PATHS = Object.freeze({
  LOGIN: '/login',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  MAGIC_LINK: '/magic-link',
});

/**
 * @param {string} path đường dẫn trang frontend (APP_PATHS)
 * @param {Object} [query] tham số query
 * @returns {string} URL tuyệt đối
 */
function buildAppUrl(path, query) {
  const url = new URL(path, env.APP_URL);
  for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);
  return url.toString();
}

/**
 * **[BÀI 15]** Kênh gửi hiện hành: setting `email.provider` (mặc định `EMAIL_DELIVERY`).
 *
 * TODO(bai-15): thay dòng `return` bằng `return settingsService.get(SETTING_KEYS.EMAIL_PROVIDER)`.
 * `get` đã lo phần khó: chưa ai chọn → giá trị mặc định; kênh đã lưu nhưng server bị gỡ biến môi
 * trường → schema trong registry từ chối → cũng về mặc định.
 *
 * Tạm thời trả luôn kênh mặc định (không ném lỗi) để email của các bài trước vẫn gửi được.
 *
 * @returns {Promise} resolve một giá trị trong EMAIL_PROVIDERS
 */
async function getCurrentProvider() {
  return env.EMAIL_DELIVERY;
}

/**
 * Gửi qua kênh hiện hành và CHỜ kết quả.
 * @param {Object} message `{ to, subject, element }`
 * @returns {Promise} resolve khi đã gửi
 * @throws {Error} khi nhà cung cấp từ chối
 */
async function deliver(message) {
  const provider = await getCurrentProvider();
  await mailer.deliver({ ...message, provider });
}

/**
 * Gửi nền qua kênh hiện hành. Đọc setting nằm TRONG phần chạy nền → request của người dùng không
 * phải chờ thêm một truy vấn DB.
 * @param {Object} message `{ to, subject, element }`
 * @returns {void}
 */
function send(message) {
  mailer.runInBackground(() => deliver(message), message);
}

/**
 * **[BÀI 03]** Email chứa link kích hoạt tài khoản.
 *
 * Các bước: gọi `send({ to, subject, element })` (hàm nội bộ ngay phía trên) với
 * - `to`: email người nhận;
 * - `subject`: `'Xác thực email của bạn'`;
 * - `element`: `h(VerifyEmail, { name, verifyUrl, expiresInHours })`, trong đó `verifyUrl` dựng
 *   bằng `buildAppUrl(APP_PATHS.VERIFY_EMAIL, { token })` — link trỏ về **frontend**, không phải
 *   về API, vì người dùng bấm link là mở trang web.
 *
 * `send` gửi **chạy nền**: không `await`, không ném lỗi ra ngoài (lỗi chỉ ghi log). Nhờ vậy
 * request của người dùng không chậm theo dịch vụ email và không thất bại khi Resend / SMTP trục
 * trặc.
 *
 * Xem `sendWelcomeEmail` / `sendMagicLinkEmail` bên dưới (đã viết sẵn) làm mẫu.
 *
 * @param {Object} params
 * @param {Object} params.user user nhận email (cần `email`, `name`)
 * @param {string} params.token token xác thực (dạng gốc, chưa hash)
 * @param {number} params.expiresInHours
 * @throws {AppError} 501 khi chưa làm
 */
function sendVerifyEmail({ user, token, expiresInHours }) {
  return notImplemented('bai-03');
}

/** @param {Object} params `{ user }` */
function sendWelcomeEmail({ user }) {
  send({
    to: user.email,
    subject: 'Chào mừng bạn đến với ứng dụng',
    element: h(WelcomeEmail, { name: user.name, appUrl: env.APP_URL }),
  });
}

/** Đăng ký lại bằng email đã kích hoạt — báo cho chủ email, không lộ gì cho người đăng ký. */
function sendAccountExistsEmail({ user }) {
  send({
    to: user.email,
    subject: 'Email này đã có tài khoản',
    element: h(AccountExistsEmail, {
      name: user.name,
      loginUrl: buildAppUrl(APP_PATHS.LOGIN),
      forgotPasswordUrl: buildAppUrl(APP_PATHS.FORGOT_PASSWORD),
    }),
  });
}

/**
 * **[BÀI 03]** Đăng ký lại bằng email chưa kích hoạt — gửi link **đặt mật khẩu** (chống
 * pre-account takeover: người đăng ký sau không được ghi đè mật khẩu của bản ghi đang có).
 *
 * Giống `sendVerifyEmail`, nhưng subject `'Đặt mật khẩu để kích hoạt tài khoản'`, template
 * `SetPasswordEmail`, và link dựng từ `APP_PATHS.RESET_PASSWORD` (prop tên `resetUrl`).
 *
 * @param {Object} params `{ user, token, expiresInMinutes }`
 * @throws {AppError} 501 khi chưa làm
 */
function sendSetPasswordEmail({ user, token, expiresInMinutes }) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 08]** Quên mật khẩu: link đặt lại mật khẩu.
 *
 * Giống `sendVerifyEmail` (bài 03): subject `'Đặt lại mật khẩu'`, template `ResetPasswordEmail`,
 * link dựng từ `APP_PATHS.RESET_PASSWORD` với prop tên `resetUrl`. Xem `sendMagicLinkEmail` ngay
 * phía trên làm mẫu.
 *
 * @param {Object} params `{ user, token, expiresInMinutes }`
 * @throws {AppError} 501 khi chưa làm
 */
function sendResetPasswordEmail({ user, token, expiresInMinutes }) {
  return notImplemented('bai-08');
}

/**
 * **[BÀI 08]** Báo mật khẩu vừa đổi — để chủ tài khoản phát hiện nếu **không phải** mình làm.
 *
 * Subject `'Mật khẩu của bạn vừa được thay đổi'`, template `PasswordChangedEmail` với hai prop:
 * `name` và `forgotPasswordUrl` (dựng bằng `buildAppUrl(APP_PATHS.FORGOT_PASSWORD)` — **không**
 * kèm token). Đây là một **cảnh báo bảo mật**: nếu người nhận không tự đổi mật khẩu, họ biết
 * ngay tài khoản đã bị chiếm, và link trong thư là đường để họ giành lại.
 *
 * @param {Object} params `{ user }`
 * @throws {AppError} 501 khi chưa làm
 */
function sendPasswordChangedEmail({ user }) {
  return notImplemented('bai-08');
}

/** @param {Object} params `{ user, token, expiresInMinutes }` */
function sendMagicLinkEmail({ user, token, expiresInMinutes }) {
  return notImplemented('bai-09');
}

const ROLE_LABELS = {
  MEMBER: 'Thành viên',
  ADMIN: 'Quản trị viên',
  SUPER_ADMIN: 'Quản trị cấp cao',
};

/** @param {Object} params `{ user }` */
function sendAccountLockedEmail({ user }) {
  send({
    to: user.email,
    subject: 'Tài khoản của bạn đã bị khoá',
    element: h(AccountLockedEmail, { name: user.name }),
  });
}

/** @param {Object} params `{ user }` */
function sendAccountUnlockedEmail({ user }) {
  send({
    to: user.email,
    subject: 'Tài khoản của bạn đã được mở khoá',
    element: h(AccountUnlockedEmail, { name: user.name, loginUrl: buildAppUrl(APP_PATHS.LOGIN) }),
  });
}

/** @param {Object} params `{ user }` — user đã mang role mới */
function sendRoleChangedEmail({ user }) {
  send({
    to: user.email,
    subject: 'Vai trò tài khoản của bạn đã thay đổi',
    element: h(RoleChangedEmail, { name: user.name, roleLabel: ROLE_LABELS[user.role] }),
  });
}

/**
 * Email thông báo chung do job gửi hàng loạt.
 * @param {Object} params `{ user, subject, content }`
 */
function sendAnnouncementEmail({ user, subject, content }) {
  return deliver({
    to: user.email,
    subject,
    element: h(AnnouncementEmail, { name: user.name, subject, content }),
  });
}

/**
 * **[BÀI 15]** Email thử cho Super Admin kiểm tra một kênh gửi (trước hoặc sau khi đổi kênh).
 *
 * Các bước:
 * 1. `try { await mailer.deliver({ to, subject, element, provider }) }` — gọi thẳng `mailer`
 *    (không qua `deliver` nội bộ) vì phải gửi qua **kênh được chọn trong request**, không phải
 *    kênh đang lưu. `subject`: `'Email thử từ trang Cấu hình'`; `element`:
 *    `h(TestEmail, { name: user.name, provider })`. **Có `await`** — khác với các email khác, ở
 *    đây người gọi cần biết kết quả để báo lên giao diện.
 * 2. `catch (err)`: `logger.warn({ err, provider }, 'Gửi email thử thất bại')` rồi ném
 *    `AppError` 502 `ERROR_CODES.EMAIL_DELIVERY_FAILED`, message
 *    `` `Gửi email thử qua ${provider} thất bại: ${err.message}` `` — lý do của nhà cung cấp
 *    (sai App Password, timeout...) là thứ Super Admin cần đọc để sửa cấu hình.
 * 3. Trả `{ to: user.email, provider }`.
 *
 * 502 (Bad Gateway) chứ không phải 500: server của mình không lỗi, **dịch vụ phía sau** từ chối.
 *
 * @param {Object} params
 * @param {Object} params.user người nhận (Super Admin đang đăng nhập)
 * @param {string} params.provider kênh cần thử (EMAIL_PROVIDERS, đã validate là dùng được)
 * @returns {Promise} resolve `{ to, provider }`
 * @throws {AppError} 502 EMAIL_DELIVERY_FAILED; 501 khi chưa làm
 */
async function sendTestEmail({ user, provider }) {
  return notImplemented('bai-15');
}

export const emailService = {
  getCurrentProvider,
  sendTestEmail,
  sendAnnouncementEmail,
  sendAccountLockedEmail,
  sendAccountUnlockedEmail,
  sendRoleChangedEmail,
  sendMagicLinkEmail,
  sendResetPasswordEmail,
  sendPasswordChangedEmail,
  sendVerifyEmail,
  sendWelcomeEmail,
  sendAccountExistsEmail,
  sendSetPasswordEmail,
};
