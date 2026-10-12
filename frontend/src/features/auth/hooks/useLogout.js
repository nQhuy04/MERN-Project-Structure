// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 06.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { logout } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ROUTES } from '@/shared/constants/routes';

/**
 * **[BÀI 06]** Đăng xuất: thu hồi phiên ở server (xoá cookie refresh), rồi dọn phiên + cache
 * phía client.
 *
 * ⚠️ Dùng **`onSettled`**, không phải `onSuccess`. `onSettled` chạy cả khi request thất bại (mất
 * mạng, server sập) — người dùng bấm "Đăng xuất" thì phải thoát được, không thể kẹt lại vì API
 * lỗi. Có test cho việc này: _"server lỗi khi đăng xuất → vẫn dọn phiên phía client"_.
 *
 * ⚠️ `queryClient.clear()` là bắt buộc: không xoá thì người đăng nhập tiếp theo trên cùng tab đọc
 * được dữ liệu đã cache của người trước.
 *
 * @returns {Object} `{ logout, isPending }`
 */
export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // TODO(bai-06): thêm `onSettled` — dọn phiên (`clearSession`), xoá cache
  // (`queryClient.clear()`), rồi `navigate(ROUTES.AUTH.LOGIN, { replace: true })`.
  const mutation = useMutation({ mutationFn: logout });

  return { logout: () => mutation.mutate(), isPending: mutation.isPending };
}
