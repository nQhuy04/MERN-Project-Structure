// check-conventions: allow-unused-imports — `nodemailer` bên dưới là gợi ý cho bài 15.
import { render } from '@react-email/components';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { EMAIL_PROVIDERS, env } from '../config/env.js';
import { features } from '../config/features.js';
import { notImplemented } from '../errors/notImplemented.js';
import { logger } from './logger.js';

/** Timeout SMTP: mặc định của Nodemailer chờ tới 2 phút khi cổng bị chặn / máy chủ không trả lời. */
const SMTP_TIMEOUTS = { connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000 };

let resendClient = null;
let smtpTransport = null;

/** Client tạo ở lần gửi đầu tiên — kênh chưa cấu hình thì không bao giờ được tạo. */
function getResendClient() {
  resendClient ??= new Resend(env.RESEND_API_KEY);
  return resendClient;
}

/**
 * **[BÀI 15]** Transport SMTP của Nodemailer — tạo ở lần gửi đầu tiên, các lần sau dùng lại.
 *
 * Các bước: `smtpTransport ??= nodemailer.createTransport({...})` rồi `return smtpTransport`.
 * Tham số của `createTransport` (lấy từ `env`, đã validate ở `shared/config/env.js`):
 * - `host`: `env.SMTP_HOST`; `port`: `env.SMTP_PORT`;
 * - `secure`: `env.SMTP_SECURE` — `true` = TLS ngay từ đầu (cổng 465), `false` = kết nối thường
 *   rồi nâng lên TLS bằng STARTTLS (cổng 587);
 * - `auth`: `{ user: env.SMTP_USER, pass: env.SMTP_PASS }`;
 * - trải `...SMTP_TIMEOUTS` — thiếu nó, máy chủ không trả lời (cổng bị chặn) làm request "Gửi
 *   email thử" treo tới 2 phút.
 *
 * Vì sao dùng lại transport thay vì tạo mới mỗi lần gửi: đỡ tốn công dựng cấu hình, và nếu sau
 * này bật `pool: true` thì các lần gửi dùng chung kết nối.
 *
 * @returns {Object} transport của Nodemailer (có `sendMail`)
 * @throws {AppError} 501 khi chưa làm
 */
function getSmtpTransport() {
  return notImplemented('bai-15');
}

/**
 * Cách gửi của từng kênh. Mỗi hàm nhận email đã render `{ to, subject, html, text }`.
 * Thêm kênh mới = thêm một mục ở đây + khai báo biến môi trường (env.js, features.js).
 */
const TRANSPORTS = {
  [EMAIL_PROVIDERS.CONSOLE]: async ({ to, subject, text }) => {
    logger.info({ to, subject }, `[email] ${subject}\n${text}`);
  },
  [EMAIL_PROVIDERS.RESEND]: async ({ to, subject, html, text }) => {
    const { error } = await getResendClient().emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    if (error) throw new Error(`Resend từ chối email: ${error.message}`);
  },
  // TODO(bai-15): `await getSmtpTransport().sendMail({ from: env.EMAIL_FROM, to, subject, html,
  // text })`. `sendMail` tự ném lỗi khi máy chủ SMTP từ chối (sai mật khẩu, timeout...) — không
  // cần kiểm tra kết quả như Resend.
  [EMAIL_PROVIDERS.SMTP]: async () => notImplemented('bai-15'),
};

/** Các lần gửi đang chạy nền — để test và graceful shutdown chờ gửi xong. */
const pendingDeliveries = new Set();

/**
 * Render và gửi một email qua kênh chỉ định, CHỜ nhà cung cấp trả lời.
 * @param {Object} message
 * @param {string} message.to
 * @param {string} message.subject
 * @param {Object} message.element React element của template email
 * @param {string} [message.provider] kênh gửi (EMAIL_PROVIDERS); mặc định `env.EMAIL_DELIVERY`
 * @returns {Promise} resolve khi đã gửi (hoặc đã in ra log)
 * @throws {Error} khi kênh chưa cấu hình, render lỗi hoặc nhà cung cấp từ chối
 */
async function deliver({ to, subject, element, provider = env.EMAIL_DELIVERY }) {
  if (!features.isEmailProviderAvailable(provider)) {
    throw new Error(`Kênh gửi email "${provider}" chưa được cấu hình biến môi trường`);
  }

  const text = await render(element, { plainText: true });
  const html = provider === EMAIL_PROVIDERS.CONSOLE ? null : await render(element);
  await TRANSPORTS[provider]({ to, subject, html, text });
}

/**
 * Chạy một lần gửi ở nền: KHÔNG chờ (request của người dùng không bị chậm hay lỗi theo dịch vụ
 * email); lỗi chỉ ghi log.
 * @param {Function} task `async () => {...}` thực hiện việc gửi (thường gọi `deliver`)
 * @param {Object} context `{ to, subject }` — ghi vào log khi lỗi
 * @returns {void}
 */
function runInBackground(task, { to, subject }) {
  const delivery = task()
    .catch((err) => logger.error({ err, to, subject }, 'Gửi email thất bại'))
    .finally(() => pendingDeliveries.delete(delivery));

  pendingDeliveries.add(delivery);
}

/**
 * Chờ mọi email đang gửi nền hoàn tất (dùng trong test và khi tắt server).
 * @returns {Promise} resolve khi không còn email nào đang gửi
 */
async function waitForPending() {
  await Promise.allSettled([...pendingDeliveries]);
}

export const mailer = { deliver, runInBackground, waitForPending };
