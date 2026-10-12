import { createBrowserRouter } from 'react-router';
import { createClientRoutes } from '@/app/router/client.routes';
import { createAdminRoutes } from '@/app/router/admin.routes';
import { createAuthRoutes } from '@/app/router/auth.routes';
import { RootRoute } from '@/app/router/RootRoute';
import { ErrorPage } from '@/pages/common/ErrorPage';
import { NotFoundPage } from '@/pages/common/NotFoundPage';
import { PageLoader } from '@/shared/components/ui/PageLoader';

/**
 * Tạo cây route đầy đủ. Là hàm (không phải mảng dùng chung) vì React Router ghi thêm dữ liệu vào
 * object route khi nạp route lazy — mỗi router (app, từng test) cần bộ object riêng.
 * @returns {Object[]}
 */
export function createAppRoutes() {
  return [
    {
      Component: RootRoute,
      ErrorBoundary: ErrorPage,
      // Hiển thị khi lần tải đầu rơi vào route lazy (vd. mở thẳng /admin).
      HydrateFallback: PageLoader,
      children: [
        ...createClientRoutes(),
        ...createAuthRoutes(),
        ...createAdminRoutes(),
        { path: '*', Component: NotFoundPage, handle: { crumb: 'Không tìm thấy trang' } },
      ],
    },
  ];
}

export const router = createBrowserRouter(createAppRoutes());
