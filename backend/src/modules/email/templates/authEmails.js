import { createElement as h } from 'react';
import { ActionButton, EmailLayout, EmailParagraph } from '../../../shared/emails/EmailLayout.js';

/**
 * Template email của luồng tài khoản. Mỗi hàm nhận dữ liệu đã chuẩn bị sẵn (tên, URL) và
 * trả về React element — không tự đọc DB hay env.
 */

export function VerifyEmail({ name, verifyUrl, expiresInHours }) {
  return h(
    EmailLayout,
    { preview: 'Xác thực email để kích hoạt tài khoản', heading: 'Xác thực email của bạn' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(
      EmailParagraph,
      null,
      'Cảm ơn bạn đã đăng ký. Bấm nút bên dưới để xác thực email và kích hoạt tài khoản.',
    ),
    h(ActionButton, { href: verifyUrl }, 'Xác thực email'),
    h(
      EmailParagraph,
      null,
      `Liên kết có hiệu lực trong ${expiresInHours} giờ. Nếu bạn không đăng ký, hãy bỏ qua email này.`,
    ),
  );
}

export function WelcomeEmail({ name, appUrl }) {
  return h(
    EmailLayout,
    { preview: 'Tài khoản của bạn đã sẵn sàng', heading: 'Chào mừng bạn!' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(
      EmailParagraph,
      null,
      'Tài khoản của bạn đã được kích hoạt. Bạn có thể bắt đầu sử dụng ngay.',
    ),
    h(ActionButton, { href: appUrl }, 'Mở ứng dụng'),
  );
}

export function AccountExistsEmail({ name, loginUrl, forgotPasswordUrl }) {
  return h(
    EmailLayout,
    { preview: 'Email này đã có tài khoản', heading: 'Bạn đã có tài khoản' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(
      EmailParagraph,
      null,
      'Ai đó (có thể là bạn) vừa đăng ký bằng email này, nhưng email đã gắn với một tài khoản đang hoạt động. Không có gì thay đổi với tài khoản của bạn.',
    ),
    h(ActionButton, { href: loginUrl }, 'Đăng nhập'),
    h(EmailParagraph, null, `Quên mật khẩu? Đặt lại tại: ${forgotPasswordUrl}`),
  );
}

export function SetPasswordEmail({ name, resetUrl, expiresInMinutes }) {
  return h(
    EmailLayout,
    { preview: 'Đặt mật khẩu để kích hoạt tài khoản', heading: 'Kích hoạt tài khoản của bạn' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(
      EmailParagraph,
      null,
      'Email này đã được đăng ký nhưng tài khoản chưa kích hoạt. Để bảo vệ tài khoản, hãy đặt mật khẩu mới — tài khoản sẽ được kích hoạt ngay sau đó. Các liên kết kích hoạt gửi trước đây không còn hiệu lực.',
    ),
    h(ActionButton, { href: resetUrl }, 'Đặt mật khẩu'),
    h(
      EmailParagraph,
      null,
      `Liên kết có hiệu lực trong ${expiresInMinutes} phút. Nếu bạn không đăng ký, hãy bỏ qua email này.`,
    ),
  );
}

export function ResetPasswordEmail({ name, resetUrl, expiresInMinutes }) {
  return h(
    EmailLayout,
    { preview: 'Đặt lại mật khẩu của bạn', heading: 'Đặt lại mật khẩu' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(
      EmailParagraph,
      null,
      'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Bấm nút bên dưới để đặt mật khẩu mới.',
    ),
    h(ActionButton, { href: resetUrl }, 'Đặt lại mật khẩu'),
    h(
      EmailParagraph,
      null,
      `Liên kết có hiệu lực trong ${expiresInMinutes} phút và chỉ dùng được một lần. Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu hiện tại vẫn giữ nguyên.`,
    ),
  );
}

export function PasswordChangedEmail({ name, forgotPasswordUrl }) {
  return h(
    EmailLayout,
    { preview: 'Mật khẩu của bạn vừa được thay đổi', heading: 'Mật khẩu đã được thay đổi' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(
      EmailParagraph,
      null,
      'Mật khẩu tài khoản của bạn vừa được thay đổi và các phiên đăng nhập khác đã bị đăng xuất.',
    ),
    h(
      EmailParagraph,
      null,
      `Nếu không phải bạn thực hiện, hãy đặt lại mật khẩu ngay tại: ${forgotPasswordUrl}`,
    ),
  );
}

export function MagicLinkEmail({ name, magicLinkUrl, expiresInMinutes }) {
  return h(
    EmailLayout,
    { preview: 'Liên kết đăng nhập của bạn', heading: 'Đăng nhập bằng liên kết' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(EmailParagraph, null, 'Bấm nút bên dưới để đăng nhập mà không cần mật khẩu.'),
    h(ActionButton, { href: magicLinkUrl }, 'Đăng nhập'),
    h(
      EmailParagraph,
      null,
      `Liên kết có hiệu lực trong ${expiresInMinutes} phút và chỉ dùng được một lần. Nếu bạn không yêu cầu, hãy bỏ qua email này.`,
    ),
  );
}

export function AccountLockedEmail({ name }) {
  return h(
    EmailLayout,
    { preview: 'Tài khoản của bạn đã bị khoá', heading: 'Tài khoản đã bị khoá' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(
      EmailParagraph,
      null,
      'Tài khoản của bạn đã bị quản trị viên khoá và mọi phiên đăng nhập đã bị đăng xuất. Vui lòng liên hệ quản trị viên nếu bạn cần hỗ trợ.',
    ),
  );
}

export function AccountUnlockedEmail({ name, loginUrl }) {
  return h(
    EmailLayout,
    { preview: 'Tài khoản của bạn đã được mở khoá', heading: 'Tài khoản đã được mở khoá' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(EmailParagraph, null, 'Tài khoản của bạn đã được mở khoá. Bạn có thể đăng nhập lại.'),
    h(ActionButton, { href: loginUrl }, 'Đăng nhập'),
  );
}

export function RoleChangedEmail({ name, roleLabel }) {
  return h(
    EmailLayout,
    { preview: 'Vai trò của bạn đã thay đổi', heading: 'Vai trò tài khoản đã thay đổi' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(EmailParagraph, null, `Vai trò mới của bạn trong hệ thống: ${roleLabel}.`),
  );
}

/**
 * Email thông báo chung (job gửi email): nội dung văn bản thuần, mỗi dòng trống tách đoạn.
 * Không render HTML từ nội dung nhập vào (React tự escape) → không chèn được mã độc.
 */
export function AnnouncementEmail({ name, subject, content }) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return h(
    EmailLayout,
    { preview: subject, heading: subject },
    h(EmailParagraph, null, `Xin chào ${name},`),
    ...paragraphs.map((paragraph, index) => h(EmailParagraph, { key: index }, paragraph)),
  );
}

/** Email thử kênh gửi (trang Cấu hình của Super Admin). */
export function TestEmail({ name, provider }) {
  return h(
    EmailLayout,
    { preview: 'Cấu hình gửi email hoạt động', heading: 'Email thử' },
    h(EmailParagraph, null, `Xin chào ${name},`),
    h(
      EmailParagraph,
      null,
      `Đây là email thử gửi qua kênh "${provider}". Bạn nhận được email này nghĩa là cấu hình gửi email của hệ thống đã đúng.`,
    ),
  );
}
