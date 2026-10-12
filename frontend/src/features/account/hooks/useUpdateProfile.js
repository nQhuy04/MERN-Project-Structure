// check-conventions: allow-unused-imports — `setUser` bên dưới là gợi ý cho bài 05.
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { updateMe } from '@/features/account/api/account.api';

/**
 * **[BÀI 05]** Cập nhật hồ sơ của chính mình.
 *
 * User của phiên đăng nhập là **client state** (Zustand), không phải server state, nên phải cập
 * nhật tại chỗ bằng dữ liệu server trả về — nhờ vậy header và menu hiện tên mới ngay, không phải
 * tải lại trang. Lưu ý `updateMe` trả cả body `{ message, data }`, nên user nằm ở `body.data`.
 */
export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);

  // TODO(bai-05): thêm `onSuccess: (body) => setUser(body.data)`.
  return useMutation({ mutationFn: updateMe });
}
