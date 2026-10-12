// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 06.
import { refreshSession } from '@/features/auth/api/auth.api';
import { notImplemented } from '@/shared/lib/practice';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * **[BÀI 06]** Lấy phiên mới bằng refresh token (cookie) và lưu vào store.
 *
 * Dùng ở hai chỗ: khi mở / tải lại app (`SessionRestorer`) và khi http client gặp 401.
 *
 * Các bước: `await refreshSession()` → `useAuthStore.getState().setSession(session)` → trả
 * `session.accessToken`.
 *
 * Trả về access token (chứ không phải cả session) vì http client cần đúng giá trị đó để gắn vào
 * header rồi gửi lại request hỏng.
 *
 * ⚠️ Dùng `useAuthStore.getState()` chứ không phải hook `useAuthStore(...)`: đây là hàm thường,
 * không phải component — gọi hook ở đây là vi phạm quy tắc của React.
 *
 * @returns {Promise} resolve access token mới
 * @throws {ApiError} khi không còn phiên hợp lệ
 */
export async function renewSession() {
  return notImplemented('bai-06');
}

/**
 * **[BÀI 06]** Phiên hết hạn / bị thu hồi: dọn phiên phía client (guard sẽ đưa về trang đăng
 * nhập).
 *
 * TODO(bai-06):
 * 1. Ghi lại `wasSignedIn` = trước đó có access token hay không (`Boolean(...)`).
 * 2. `useAuthStore.getState().clearSession()`.
 * 3. Trả `wasSignedIn`.
 *
 * Vì sao phải trả giá trị đó? `SessionRestorer` cũng gọi hàm này khi mở app mà **không có** phiên
 * — đó là trạng thái bình thường của khách, không phải lỗi. Chỉ khi trước đó **đang** đăng nhập
 * thì mới hiện toast "Phiên đăng nhập đã hết hạn" (xem `app/providers.jsx`).
 *
 * **Trả về giá trị an toàn khi chưa làm**: hàm này chạy trong đường đi render / khôi phục phiên,
 * ném lỗi ở đây là app kẹt ở màn hình loading.
 *
 * @returns {boolean} true nếu trước đó đang đăng nhập
 */
export function expireSession() {
  // TODO(bai-06): thay bằng logic thật.
  useAuthStore.getState().clearSession();
  return false;
}
