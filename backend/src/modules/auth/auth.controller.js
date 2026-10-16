// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 02–06.
import { env } from '../../shared/config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { logger } from '../../shared/lib/logger.js';
import {
  OAUTH_STATE_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearOAuthStateCookie,
  clearRefreshTokenCookie,
  setOAuthStateCookie,
  setRefreshTokenCookie,
} from '../../shared/utils/cookies.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { authService } from './auth.service.js';

/**
 * Thông tin thiết bị để hiển thị trong danh sách phiên đăng nhập.
 * @param {Object} req Express request
 * @returns {Object} `{ userAgent, ip }`
 */
function getClientInfo(req) {
  return { userAgent: req.get('user-agent') ?? '', ip: req.ip ?? '' };
}

/**
 * **[BÀI 02]** `POST /auth/register`.
 *
 * Các bước: `await` service với dữ liệu ĐÃ validate (`req.validated.body`), rồi trả 200 bằng
 * `sendSuccess(res, data, message)` với `data = null` và thông điệp
 * `'Vui lòng kiểm tra email để hoàn tất đăng ký'`.
 *
 * Thông điệp giống hệt nhau dù email đã tồn tại hay chưa — đó là lý do không trả về `user`.
 * Không cần `try/catch`: Express 5 tự chuyển lỗi của hàm `async` tới `errorHandler`.
 */
async function register(req, res) {
  await authService.register(req.validated.body);
  sendSuccess(res, null, 'Vui lòng kiểm tra email để hoàn tất đăng ký');
}

/**
 * **[BÀI 03]** `POST /auth/verify-email`. Cùng khuôn với `register`: `await` service với
 * `req.validated.body`, rồi `sendSuccess(res, null, 'Xác thực email thành công, tài khoản đã
 * được kích hoạt')`.
 */
async function verifyEmail(req, res) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 03]** `POST /auth/resend-verification`. `await` service rồi trả thông điệp
 * `'Nếu email thuộc một tài khoản chưa kích hoạt, chúng tôi đã gửi lại liên kết'` — giống hệt
 * nhau dù có gửi hay không, để không lộ email nào đã đăng ký.
 */
async function resendVerification(req, res) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 04]** `POST /auth/login`.
 *
 * Các bước:
 * 1. `await authService.login(req.validated.body, getClientInfo(req))` →
 *    `{ accessToken, refreshToken, user }`.
 * 2. `setRefreshTokenCookie(res, refreshToken)` — helper có sẵn, đặt cookie **httpOnly** với
 *    `path=/api/v1/auth` (chỉ route auth mới nhận được cookie này).
 * 3. `sendSuccess(res, { accessToken, user }, 'Đăng nhập thành công')`.
 *
 * ⚠️ **Refresh token đi bằng cookie, KHÔNG nằm trong body.** Body chỉ chứa access token (frontend
 * giữ trong bộ nhớ) và user. Nếu trả refresh token trong body thì JavaScript đọc được nó, và ưu
 * thế của cookie `httpOnly` biến mất.
 */
async function login(req, res) {
  return notImplemented('bai-04');
}

/**
 * **[BÀI 06]** `POST /auth/refresh`.
 *
 * Các bước:
 * 1. Trong `try`: `await authService.refresh(req.cookies[REFRESH_TOKEN_COOKIE], getClientInfo(req))`.
 * 2. `refreshToken` khác `null` → `setRefreshTokenCookie(res, refreshToken)`. **Có thể là `null`**
 *    khi request rơi vào cửa sổ ân hạn — khi đó cookie hiện tại đã đúng rồi, đặt lại bằng token
 *    cũ sẽ ghi đè mất token mới mà tab khác vừa nhận.
 * 3. `sendSuccess(res, { accessToken, user })` — **không** message.
 * 4. Trong `catch`: `clearRefreshTokenCookie(res)` rồi **ném lại lỗi** (`throw err`).
 *
 * Đây là controller **duy nhất** cần `try/catch`: cookie hỏng phải bị xoá, nếu không trình duyệt
 * gửi lại nó mãi mãi và người dùng kẹt trong vòng 401. Header `Set-Cookie` vẫn giữ nguyên trong
 * response lỗi, nên ném lại lỗi để `errorHandler` trả JSON chuẩn là đủ.
 */
async function refresh(req, res) {
  return notImplemented('bai-06');
}

/**
 * **[BÀI 06]** `POST /auth/logout`. `await` service với cookie, `clearRefreshTokenCookie(res)`,
 * rồi `sendSuccess(res, null, 'Đã đăng xuất')`. Xoá cookie **kể cả khi** không có phiên nào bị
 * thu hồi.
 */
async function logout(req, res) {
  return notImplemented('bai-06');
}

/**
 * **[BÀI 08]** `POST /auth/forgot-password`. `await` service rồi trả thông điệp `'Nếu email có
 * tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu'` — giống hệt nhau dù email có tồn tại
 * hay không.
 */
async function forgotPassword(req, res) {
  return notImplemented('bai-08');
}

/**
 * **[BÀI 08]** `POST /auth/reset-password`. `await` service rồi trả `'Đặt lại mật khẩu thành
 * công. Vui lòng đăng nhập bằng mật khẩu mới'`.
 */
async function resetPassword(req, res) {
  return notImplemented('bai-08');
}

/**
 * **[BÀI 09]** `POST /auth/magic-link`. `await` service rồi trả `'Nếu email có tài khoản, chúng
 * tôi đã gửi liên kết đăng nhập'` — giống hệt nhau dù email có tồn tại hay không.
 */
async function requestMagicLink(req, res) {
  return notImplemented('bai-09');
}

/**
 * **[BÀI 09]** `POST /auth/magic-link/verify`. Giống hệt `login` của bài 04: gọi service với
 * `req.validated.body` + `getClientInfo(req)`, đặt cookie refresh, rồi `sendSuccess` với
 * `{ accessToken, user }` và message `'Đăng nhập thành công'`.
 */
async function loginWithMagicLink(req, res) {
  return notImplemented('bai-09');
}

const GOOGLE_CALLBACK_PAGE = '/auth/callback';

/**
 * **[BÀI 10]** `GET /auth/google` — điều hướng trình duyệt sang Google.
 *
 * Các bước: `const { url, state, codeVerifier } = await authService.startGoogleLogin()`,
 * `setOAuthStateCookie(res, { state, codeVerifier })` (cookie tạm httpOnly, SameSite=Lax), rồi
 * `res.redirect(url)`.
 *
 * ⚠️ Đây **không** phải API trả JSON: trình duyệt điều hướng cả trang sang Google, nên dùng
 * `res.redirect` chứ không `sendSuccess`.
 */
async function startGoogleLogin(_req, res) {
  return notImplemented('bai-10');
}

/**
 * **[BÀI 10]** `GET /auth/google/callback` — Google chuyển trình duyệt về đây.
 *
 * Các bước:
 * 1. `const redirectUrl = new URL(GOOGLE_CALLBACK_PAGE, env.APP_URL)` — trang của **frontend**.
 * 2. Trong `try`: `authService.completeGoogleLogin({ query: req.query, stateCookie:
 *    req.cookies[OAUTH_STATE_COOKIE] }, getClientInfo(req))`, lấy `refreshToken` rồi
 *    `setRefreshTokenCookie(res, refreshToken)`.
 * 3. Trong `catch`: lỗi **không phải** `AppError` → ghi log (`logger.error`). Gắn
 *    `redirectUrl.searchParams.set('error', <mã>)` — mã là `err.code` nếu là `AppError`, ngược
 *    lại `ERROR_CODES.OAUTH_FAILED`.
 * 4. Dù thành công hay thất bại: `clearOAuthStateCookie(res)` rồi
 *    `res.redirect(redirectUrl.toString())`.
 *
 * ⚠️ **Luôn redirect, không bao giờ để lỗi rơi xuống `errorHandler`.** Đây là một lần **điều
 * hướng trang**, không phải lời gọi API: `errorHandler` sẽ trả JSON và người dùng nhìn thấy một
 * đống JSON thô giữa trình duyệt. Thay vào đó, lỗi được mã hoá thành `?error=CODE` để trang
 * `/auth/callback` của frontend hiển thị thông điệp tử tế.
 *
 * ⚠️ **Không trả access token qua URL.** Chỉ đặt cookie refresh; frontend tự gọi `/auth/refresh`
 * để lấy access token (bài 06). Token trên URL sẽ nằm lại trong lịch sử trình duyệt, log của
 * proxy và header `Referer`.
 */
async function handleGoogleCallback(req, res) {
  return notImplemented('bai-10');
}

export const authController = {
  startGoogleLogin,
  handleGoogleCallback,
  requestMagicLink,
  loginWithMagicLink,
  forgotPassword,
  resetPassword,
  register,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
};
