// check-conventions: allow-unused-imports — `usersKeys` bên dưới là gợi ý cho bài 11.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeUserRole,
  listUsers,
  lockUser,
  unlockUser,
  usersKeys,
} from '@/features/users/api/users.api';

/**
 * Danh sách người dùng theo bộ lọc. Giữ dữ liệu trang cũ khi chuyển trang/lọc để bảng không
 * nhấp nháy về trạng thái loading.
 * @param {Object} params
 */
export function useAdminUsers(params) {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * **[BÀI 11]** Mọi thao tác quản trị user (khoá / mở khoá / đổi vai trò) dùng chung hook này.
 *
 * TODO(bai-11): thêm `onSuccess` gọi
 * `queryClient.invalidateQueries({ queryKey: usersKeys.all })`.
 *
 * Dùng **`usersKeys.all`** (tiền tố chung) chứ không phải key của đúng một bộ lọc: sau khi khoá
 * một người, *mọi* danh sách đang cache đều có thể sai — kể cả danh sách lọc theo "Đang hoạt
 * động" ở trang khác. TanStack Query khớp key theo tiền tố nên một lời gọi là đủ.
 */
function useUserMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn });
}

export const useLockUser = () => useUserMutation(lockUser);
export const useUnlockUser = () => useUserMutation(unlockUser);
export const useChangeUserRole = () => useUserMutation(changeUserRole);
