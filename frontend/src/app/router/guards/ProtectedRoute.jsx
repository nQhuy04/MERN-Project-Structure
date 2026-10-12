// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 05.
import { Navigate, Outlet, useLocation } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';

/**
 * **[BÀI 05]** Chỉ cho người đã đăng nhập đi tiếp.
 *
 * TODO(bai-05):
 * 1. Chưa có `currentUser` → `<Navigate to={...} replace />` về `ROUTES.AUTH.LOGIN`, kèm query
 *    `?redirect=<đường dẫn hiện tại + query>` (dùng `location.pathname` + `location.search` và
 *    `new URLSearchParams({ redirect })`) để sau khi đăng nhập quay lại đúng trang đang mở.
 * 2. Có rồi → `<Outlet />`.
 *
 * Xem `GuestOnly.jsx` (đã viết sẵn) — guard đối xứng với guard này — làm mẫu.
 *
 * ⚠️ `replace` là bắt buộc: không có nó thì trang bị chặn nằm lại trong lịch sử, người dùng bấm
 * Back là quay về đó rồi lại bị đá đi — kẹt vòng lặp.
 *
 * Đây chỉ là **trải nghiệm người dùng**. Backend vẫn tự kiểm tra token ở mọi request; xoá guard
 * này đi thì trang hiện ra nhưng mọi lời gọi API đều 401.
 */
export function ProtectedRoute() {
  const currentUser = useCurrentUser();
  const location = useLocation();

  // TODO(bai-05): thay dòng dưới bằng logic thật.
  return currentUser && location ? <Outlet /> : <Outlet />;
}
