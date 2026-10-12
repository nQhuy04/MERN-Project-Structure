// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 10.
import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import { env } from '../config/env.js';
import { notImplemented } from '../errors/notImplemented.js';
import { generateToken } from '../utils/token.js';

/**
 * Bọc google-auth-library cho luồng OAuth 2.0 Authorization Code + PKCE (không dùng Passport).
 * Export dạng object để test thay bằng `vi.spyOn(googleOAuth, ...)` — không gọi Google thật.
 */

const SCOPES = ['openid', 'email', 'profile'];

// Chỉ tạo client khi có cấu hình; tắt Google OAuth thì các route đã trả 404 trước khi gọi tới.
const client = env.GOOGLE_OAUTH_ENABLED
  ? new OAuth2Client({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_REDIRECT_URI,
    })
  : null;

/**
 * **[BÀI 10]** Tạo URL chuyển người dùng sang trang đăng nhập Google.
 *
 * Các bước:
 * 1. `state = generateToken()` — chuỗi ngẫu nhiên chống CSRF.
 * 2. `const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync()` (PKCE).
 * 3. `client.generateAuthUrl({ scope: SCOPES, state, code_challenge_method:
 *    CodeChallengeMethod.S256, code_challenge: codeChallenge, prompt: 'select_account' })`.
 * 4. Trả `{ url, state, codeVerifier }` — hai giá trị sau sẽ được controller cất vào **cookie
 *    tạm httpOnly**, không gửi cho Google.
 *
 * Hai cơ chế bảo vệ, hai mục đích khác nhau:
 * - **`state`** chống **CSRF đăng nhập**: kẻ gian bắt đầu luồng OAuth bằng tài khoản Google của
 *   *hắn*, rồi lừa nạn nhân mở URL callback kèm code của hắn. Nạn nhân bỗng "đăng nhập" vào tài
 *   khoản của kẻ gian và mọi thứ họ làm sau đó nằm trong tài khoản ấy. `state` khớp với cookie
 *   của **chính trình duyệt này** nên callback lạ bị từ chối.
 * - **PKCE** chống **đánh cắp authorization code**: `codeVerifier` **không bao giờ** rời server;
 *   Google chỉ nhận `codeChallenge` (bản băm S256). Ai chặn được code trên đường về cũng không
 *   đổi nó lấy token được, vì không có verifier.
 *
 * @returns {Promise} resolve `{ url, state, codeVerifier }` — state + codeVerifier lưu vào cookie tạm
 * @throws {AppError} 501 khi chưa làm
 */
async function createAuthorizationRequest() {
  return notImplemented('bai-10');
}

/**
 * **[BÀI 10]** Đổi authorization code lấy ID token, xác minh, rồi rút ra hồ sơ người dùng.
 *
 * Các bước:
 * 1. `const { tokens } = await client.getToken({ code, codeVerifier })`.
 * 2. `const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience:
 *    env.GOOGLE_CLIENT_ID })` — **bắt buộc**, xem cảnh báo bên dưới.
 * 3. `const payload = ticket.getPayload()`.
 * 4. Trả `{ googleId: payload.sub, email: payload.email?.toLowerCase(), emailVerified:
 *    payload.email_verified === true, name: payload.name || payload.email }`.
 *
 * ⚠️ **Phải `verifyIdToken`, không được tự giải mã JWT.** ID token là một JWT có chữ ký của
 * Google; đọc payload mà không kiểm chữ ký thì bất kỳ ai cũng tự tạo được một token nói "tôi là
 * `sep@gmail.com`". Kiểm **`audience`** cũng quan trọng ngang: không có nó, một ID token hợp lệ
 * cấp cho **ứng dụng khác** vẫn được chấp nhận ở đây.
 *
 * ⚠️ `emailVerified` so sánh **`=== true`**, không dùng giá trị "truthy": Google có thể trả chuỗi
 * `'true'`/`'false'`, mà `'false'` là truthy trong JavaScript.
 *
 * @param {Object} params
 * @param {string} params.code code Google trả về callback
 * @param {string} params.codeVerifier lấy từ cookie tạm
 * @returns {Promise} resolve `{ googleId, email, emailVerified, name }`
 * @throws {Error} code sai/hết hạn, ID token không hợp lệ
 */
async function exchangeCode({ code, codeVerifier }) {
  return notImplemented('bai-10');
}

export const googleOAuth = { createAuthorizationRequest, exchangeCode };
