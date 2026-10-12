// check-conventions: allow-unused-imports — `refreshPromise` bên dưới là gợi ý cho bài 06.
import axios from 'axios';
import { ApiError } from '@/shared/lib/apiError';
import { notImplemented } from '@/shared/lib/practice';

/** Base URL của API (kèm /api/v1) — dùng cho link điều hướng trình duyệt sang API (vd. Google). */
export const API_URL = import.meta.env.VITE_API_URL;
const REQUEST_TIMEOUT_MS = 15_000;
const HTTP_UNAUTHORIZED = 401;

if (!API_URL) {
  throw new Error('Thiếu biến môi trường VITE_API_URL (xem frontend/.env.example)');
}

/**
 * HTTP client duy nhất của frontend. Mọi lời gọi API đi qua đây (ngoại lệ duy
 * nhất: upload thẳng lên R2 bằng presigned URL).
 * - Gửi cookie (refresh token httpOnly) kèm request.
 * - Header X-Requested-With: backend dùng để chặn CSRF ở route refresh/logout.
 * - Gắn access token (nếu có) vào header Authorization.
 * - Gặp 401 → refresh đúng 1 lần (gộp các refresh đồng thời) → gửi lại request.
 * - Mọi lỗi được chuẩn hoá thành ApiError.
 *
 * Request gắn `skipAuthRefresh: true` (đăng nhập, refresh, đăng xuất) không tự refresh.
 */
export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

// `shared/` không được biết về feature auth → tầng app đăng ký các hàm này (configureHttpAuth).
const authHandlers = {
  getAccessToken: () => null,
  refreshSession: async () => {
    throw new Error('Chưa cấu hình refreshSession');
  },
  onSessionExpired: () => {},
};

/**
 * Kết nối http client với nơi giữ phiên đăng nhập (gọi một lần ở tầng app).
 * @param {Object} handlers
 * @param {Function} handlers.getAccessToken trả về access token hiện tại hoặc null
 * @param {Function} handlers.refreshSession gọi API refresh, lưu phiên mới, resolve access token mới
 * @param {Function} handlers.onSessionExpired refresh thất bại → dọn phiên phía client
 */
export function configureHttpAuth(handlers) {
  Object.assign(authHandlers, handlers);
}

let refreshPromise = null;

/**
 * **[BÀI 06]** Nhiều request cùng nhận 401 → chỉ gọi refresh **một lần**, tất cả chờ chung kết
 * quả.
 *
 * Các bước: nếu `refreshPromise` chưa có thì gán nó = `authHandlers.refreshSession()`, kèm
 * `.finally(() => { refreshPromise = null; })` để lần sau còn refresh lại được. Rồi trả
 * `refreshPromise`. Toán tử `??=` làm gọn phần "chưa có thì gán".
 *
 * ⚠️ Vì sao không để mỗi request tự gọi refresh? Refresh token **xoay vòng**: request đầu tiên
 * thành công sẽ huỷ secret cũ, những request sau gửi đúng secret vừa bị huỷ → server coi là token
 * bị đánh cắp và **thu hồi cả phiên**. Người dùng đang làm việc bình thường bỗng bị văng ra, và
 * lỗi chỉ xuất hiện khi trang gọi nhiều API cùng lúc nên rất khó tái hiện.
 *
 * ⚠️ Phần `.finally` reset về `null` cũng bắt buộc: thiếu nó thì sau lần refresh đầu tiên, mọi
 * lần 401 về sau đều dùng lại promise cũ đã settled — lần hết hạn thứ hai sẽ không refresh nữa.
 *
 * @returns {Promise} resolve access token mới
 */
function refreshSessionOnce() {
  return notImplemented('bai-06');
}

http.interceptors.request.use((config) => {
  const accessToken = authHandlers.getAccessToken();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const shouldRefresh =
      response?.status === HTTP_UNAUTHORIZED &&
      config &&
      !config.skipAuthRefresh &&
      !config.hasRetriedAfterRefresh;

    if (!shouldRefresh) return Promise.reject(ApiError.fromAxiosError(error));

    try {
      const accessToken = await refreshSessionOnce();
      config.hasRetriedAfterRefresh = true;
      config.headers.Authorization = `Bearer ${accessToken}`;
      return http(config);
    } catch {
      authHandlers.onSessionExpired();
      return Promise.reject(ApiError.fromAxiosError(error));
    }
  },
);
