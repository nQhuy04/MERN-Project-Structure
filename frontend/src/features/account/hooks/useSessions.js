// check-conventions: allow-unused-imports — `queryClient` bên dưới là gợi ý cho bài 07.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  accountKeys,
  getSessions,
  revokeOtherSessions,
  revokeSession,
} from '@/features/account/api/account.api';

/** Danh sách thiết bị đang đăng nhập. */
export function useSessions() {
  return useQuery({ queryKey: accountKeys.sessions(), queryFn: getSessions });
}

/**
 * **[BÀI 07]** Thu hồi một phiên; xong thì tải lại danh sách.
 *
 * TODO(bai-07): thêm `onSuccess` gọi
 * `queryClient.invalidateQueries({ queryKey: accountKeys.sessions() })`.
 *
 * `invalidateQueries` đánh dấu dữ liệu đã cũ → `useSessions` đang mở sẽ tự gọi lại API. Không có
 * nó, danh sách vẫn hiện thiết bị vừa bị thu hồi cho tới khi người dùng F5 — đúng lúc họ cần
 * thấy kết quả nhất. Dùng **query key factory** (`accountKeys.sessions()`) chứ không viết tay
 * mảng key, để hai nơi không bao giờ lệch nhau.
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: revokeSession });
}

/** **[BÀI 07]** Đăng xuất mọi thiết bị khác; xong thì tải lại danh sách (giống hook trên). */
export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: revokeOtherSessions });
}
