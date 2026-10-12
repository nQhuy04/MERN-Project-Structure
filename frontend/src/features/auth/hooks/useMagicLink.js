// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 09.
import { useMutation } from '@tanstack/react-query';
import { requestMagicLink, verifyMagicLink } from '@/features/auth/api/auth.api';
import { useConsumeTokenOnce } from '@/features/auth/hooks/useConsumeTokenOnce';
import { useAuthStore } from '@/features/auth/store/authStore';
import { notImplemented } from '@/shared/lib/practice';

/** Gửi liên kết đăng nhập qua email. */
export function useRequestMagicLink() {
  return useMutation({ mutationFn: requestMagicLink });
}

/**
 * Đăng nhập bằng token trong magic link — tự gọi đúng 1 lần khi trang mở, thành công thì lưu phiên.
 * @param {string|null} token
 */
export function useMagicLinkLogin(token) {
  // TODO(bai-09): truyền vào `useConsumeTokenOnce` một hàm async nhận `body`, gọi
  // `verifyMagicLink(body)`, lưu phiên bằng `useAuthStore.getState().setSession(session)` rồi trả
  // `session`. Hook `useConsumeTokenOnce` (bài 03) lo phần gọi đúng một lần.
  return useConsumeTokenOnce(() => notImplemented('bai-09'), token);
}
