// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 05.
import { Outlet } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { ForbiddenPage } from '@/pages/common/ForbiddenPage';

/**
 * **[BÀI 05]** Chỉ cho các role được liệt kê đi tiếp; sai role → `<ForbiddenPage />`.
 *
 * TODO(bai-05): không có `currentUser`, **hoặc** `currentUser.role` không nằm trong `roles` →
 * trả `<ForbiddenPage />`; ngược lại trả `<Outlet />`.
 *
 * Đặt **bên trong** `ProtectedRoute` nên về lý thuyết luôn có user — vẫn kiểm `!currentUser` để
 * component không phụ thuộc vào thứ tự đặt route.
 *
 * ⚠️ Đây là lớp **hiển thị**, không phải lớp bảo mật. Người dùng sửa được state trong trình
 * duyệt. Quyền thật do backend giữ: `authorize` ở route (lớp 1) + quy tắc trong service (lớp 2,
 * bài 11).
 *
 * @param {Object} props
 * @param {string[]} props.roles
 */
export function RoleGuard({ roles }) {
  const currentUser = useCurrentUser();

  // TODO(bai-05): thay dòng dưới bằng logic thật.
  return currentUser && roles ? <Outlet /> : <ForbiddenPage />;
}
