// check-conventions: allow-unused-imports — `setSession` bên dưới là gợi ý cho bài 04.
import { useMutation } from '@tanstack/react-query';
import { login } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * **[BÀI 04]** Đăng nhập bằng email + mật khẩu; thành công → lưu phiên vào store.
 *
 * TODO(bai-04): trả về `useMutation({ mutationFn: login, onSuccess })`, trong đó `onSuccess`
 * nhận `session` (`{ accessToken, user }` do `login` trả về) và gọi `setSession(session)`.
 *
 * Không điều hướng ở đây: việc đó do guard `GuestOnly` lo (bài 05). Store có user → guard thấy
 * và tự đưa tới `?redirect=` hoặc dashboard. Nhờ vậy mọi cách đăng nhập (mật khẩu, magic link,
 * Google) dùng chung một chỗ điều hướng.
 */
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({ mutationFn: login });
}
