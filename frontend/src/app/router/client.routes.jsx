import { Navigate } from 'react-router';
import { ProtectedRoute } from '@/app/router/guards/ProtectedRoute';
import { AccountLayout } from '@/layouts/AccountLayout';
import { ClientLayout } from '@/layouts/ClientLayout';
import { DashboardPage } from '@/pages/client/DashboardPage';
import { HomePage } from '@/pages/client/HomePage';
import { FilesPage } from '@/pages/client/account/FilesPage';
import { ProfilePage } from '@/pages/client/account/ProfilePage';
import { SecurityPage } from '@/pages/client/account/SecurityPage';
import { SessionsPage } from '@/pages/client/account/SessionsPage';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Nhóm route khu ứng dụng (header + menu chính). `handle.crumb` = nhãn breadcrumb và tiêu đề
 * tab của trang (xem `shared/hooks/useRouteMeta.js`).
 */
export function createClientRoutes() {
  return [
    {
      path: ROUTES.HOME,
      Component: ClientLayout,
      handle: { crumb: 'Trang chủ' },
      children: [
        { index: true, Component: HomePage },
        {
          Component: ProtectedRoute,
          children: [
            {
              path: ROUTES.DASHBOARD,
              Component: DashboardPage,
              handle: { crumb: 'Trang của tôi' },
            },
            {
              path: ROUTES.ACCOUNT.ROOT,
              Component: AccountLayout,
              handle: { crumb: 'Tài khoản' },
              children: [
                { index: true, element: <Navigate to={ROUTES.ACCOUNT.PROFILE} replace /> },
                {
                  path: ROUTES.ACCOUNT.PROFILE,
                  Component: ProfilePage,
                  handle: { crumb: 'Hồ sơ cá nhân' },
                },
                {
                  path: ROUTES.ACCOUNT.FILES,
                  Component: FilesPage,
                  handle: { crumb: 'Tệp của tôi' },
                },
                {
                  path: ROUTES.ACCOUNT.SECURITY,
                  Component: SecurityPage,
                  handle: { crumb: 'Bảo mật' },
                },
                {
                  path: ROUTES.ACCOUNT.SESSIONS,
                  Component: SessionsPage,
                  handle: { crumb: 'Phiên đăng nhập' },
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}
