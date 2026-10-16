// check-conventions: allow-unused-imports — `http` bên dưới là gợi ý cho bài 02–09.
import { http } from '@/shared/lib/http';
import { notImplemented } from '@/shared/lib/practice';

/**
 * Hàm gọi API của feature auth. Trả về body response (`{ success, message, data }`);
 * lỗi được http client chuẩn hoá thành ApiError.
 */

/**
 * **[BÀI 02]** Gọi `POST /auth/register`.
 *
 * Các bước: `await http.post('<đường dẫn>', body)` rồi trả về `response.data` — tức **body của
 * response** (`{ success, message, data }`), không phải object của axios. Xem các hàm bên dưới
 * làm mẫu. Đường dẫn **không** có tiền tố `/api/v1` (http client đã có `baseURL`).
 *
 * @param {Object} body `{ name, email, password }`
 * @returns {Promise} resolve body response
 * @throws {ApiError} VALIDATION_ERROR (kèm `details` từng trường) | RATE_LIMITED
 */
export async function register(body) {
  const response = await http.post('/auth/register', body);
  return response.data;
}

/**
 * **[BÀI 03]** Gọi `POST /auth/verify-email`. Cùng khuôn với `register` ở bài 02.
 * @param {Object} body `{ token }`
 * @returns {Promise} resolve body response
 * @throws {ApiError} TOKEN_INVALID khi link sai/hết hạn/đã dùng
 */
export async function verifyEmail(body) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 03]** Gọi `POST /auth/resend-verification`.
 * @param {Object} body `{ email }`
 * @returns {Promise} resolve body response (luôn thành công nếu email hợp lệ)
 */
export async function resendVerification(body) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 04]** Gọi `POST /auth/login`.
 *
 * Khác hai hàm trên ở **hai** chỗ:
 * 1. Truyền option thứ ba `{ skipAuthRefresh: true }`. Endpoint này là nơi *lấy* phiên, nên khi
 *    nó trả 401 thì http client **không được** đi gọi refresh rồi thử lại (sẽ lặp vô hạn).
 * 2. Trả `response.data.data` — tức trường `data` **bên trong** body, vì nơi gọi cần thẳng
 *    `{ accessToken, user }` chứ không cần cả `{ success, message, data }`.
 *
 * @param {Object} body `{ email, password }`
 * @returns {Promise} resolve `{ accessToken, user }`; refresh token được đặt vào cookie httpOnly
 * @throws {ApiError} INVALID_CREDENTIALS | EMAIL_NOT_VERIFIED | ACCOUNT_LOCKED
 */
export async function login(body) {
  return notImplemented('bai-04');
}

/**
 * **[BÀI 06]** Đổi refresh token (cookie httpOnly) lấy access token mới.
 *
 * Các bước: `http.post('/auth/refresh', null, { skipAuthRefresh: true })` rồi trả
 * `response.data.data`. Body là `null` — refresh token đi bằng **cookie**, trình duyệt tự gửi.
 *
 * ⚠️ `skipAuthRefresh: true` là bắt buộc: đây **chính là** endpoint refresh, nếu nó trả 401 mà
 * client lại đi gọi refresh thì thành đệ quy vô hạn.
 *
 * @returns {Promise} resolve `{ accessToken, user }`
 * @throws {ApiError} AUTH_TOKEN_INVALID khi chưa đăng nhập / phiên hết hạn
 */
export async function refreshSession() {
  return notImplemented('bai-06');
}

/**
 * **[BÀI 06]** Thu hồi phiên hiện tại ở server và xoá cookie refresh.
 *
 * Các bước: `http.post('/auth/logout', null, { skipAuthRefresh: true })`. Không cần trả gì.
 *
 * @returns {Promise} resolve khi xong
 */
export async function logout() {
  return notImplemented('bai-06');
}

/**
 * **[BÀI 03]** Gọi `POST /auth/resend-verification`.
 * @param {Object} body `{ email }`
 * @returns {Promise} resolve body response (luôn thành công nếu email hợp lệ)
 */
export async function forgotPassword(body) {
  return notImplemented('bai-08');
}

/**
 * @param {Object} body `{ token, password }`
 * @returns {Promise} resolve body response
 * @throws {ApiError} TOKEN_INVALID
 */
export async function resetPassword(body) {
  return notImplemented('bai-08');
}

/**
 * @param {Object} body `{ currentPassword, newPassword }`
 * @returns {Promise} resolve body response
 * @throws {ApiError} INVALID_CURRENT_PASSWORD | PASSWORD_NOT_SET
 */
export async function changePassword(body) {
  return notImplemented('bai-08');
}

/**
 * @param {Object} body `{ email }`
 * @returns {Promise} resolve body response (luôn thành công nếu email hợp lệ)
 * @throws {ApiError} FEATURE_DISABLED
 */
export async function requestMagicLink(body) {
  return notImplemented('bai-09');
}

/**
 * @param {Object} body `{ token }`
 * @returns {Promise} resolve `{ accessToken, user }`; cookie refresh được đặt
 * @throws {ApiError} TOKEN_INVALID | FEATURE_DISABLED | ACCOUNT_LOCKED
 */
export async function verifyMagicLink(body) {
  return notImplemented('bai-09');
}
