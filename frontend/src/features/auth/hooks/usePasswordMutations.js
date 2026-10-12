// check-conventions: allow-unused-imports — `expireSession` bên dưới là gợi ý cho bài 08.
import { useMutation } from '@tanstack/react-query';
import { changePassword, forgotPassword, resetPassword } from '@/features/auth/api/auth.api';
import { expireSession } from '@/features/auth/session';

/** Gửi link đặt lại mật khẩu. */
export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword });
}

/**
 * **[BÀI 08]** Đặt lại mật khẩu.
 *
 * TODO(bai-08): thêm `onSuccess: () => expireSession()`.
 *
 * Server vừa thu hồi **mọi** phiên, nên access token đang giữ trong bộ nhớ đã chết. Không dọn
 * phía client thì người dùng vẫn thấy mình "đang đăng nhập", và thao tác kế tiếp mới báo lỗi.
 */
export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}

/** Đổi mật khẩu khi đang đăng nhập (phiên hiện tại được giữ). */
export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
