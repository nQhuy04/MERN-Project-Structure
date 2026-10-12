import { ProtectedRoute } from '@/app/router/guards/ProtectedRoute';
import { RoleGuard } from '@/app/router/guards/RoleGuard';
import { ADMIN_ROLES, USER_ROLES } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Nhóm route quản trị: phải đăng nhập + có role quản trị. Code admin tải lười (lazy) để người
 * dùng thường không phải tải. Quyền từng trang khớp với `authorize` ở backend. `handle.crumb` =
 * nhãn breadcrumb + tiêu đề tab.
 * @returns {Object[]}
 */
export function createAdminRoutes() {
  return [
    {
      Component: ProtectedRoute,
      children: [
        {
          element: <RoleGuard roles={ADMIN_ROLES} />,
          children: [
            {
              path: ROUTES.ADMIN.ROOT,
              handle: { crumb: 'Quản trị' },
              lazy: {
                Component: async () => (await import('@/layouts/AdminLayout')).AdminLayout,
              },
              children: [
                {
                  index: true,
                  handle: { crumb: 'Tổng quan' },
                  lazy: {
                    Component: async () =>
                      (await import('@/pages/admin/AdminDashboardPage')).AdminDashboardPage,
                  },
                },
                {
                  path: ROUTES.ADMIN.USERS,
                  handle: { crumb: 'Người dùng' },
                  lazy: {
                    Component: async () =>
                      (await import('@/pages/admin/AdminUsersPage')).AdminUsersPage,
                  },
                },
                {
                  path: ROUTES.ADMIN.MEDIA,
                  handle: { crumb: 'Thư viện ảnh' },
                  children: [
                    {
                      index: true,
                      lazy: {
                        Component: async () =>
                          (await import('@/pages/admin/AdminMediaPage')).AdminMediaPage,
                      },
                    },
                    {
                      path: ROUTES.ADMIN.MEDIA_ALL,
                      handle: { crumb: 'Tất cả ảnh' },
                      lazy: {
                        Component: async () =>
                          (await import('@/pages/admin/AdminMediaBrowsePage')).AdminMediaBrowsePage,
                      },
                    },
                    {
                      path: ROUTES.ADMIN.MEDIA_FOLDER,
                      handle: { crumb: (match) => match.params.folder },
                      lazy: {
                        Component: async () =>
                          (await import('@/pages/admin/AdminMediaBrowsePage')).AdminMediaBrowsePage,
                      },
                    },
                  ],
                },
                {
                  element: <RoleGuard roles={[USER_ROLES.SUPER_ADMIN]} />,
                  children: [
                    {
                      path: ROUTES.ADMIN.JOBS,
                      handle: { crumb: 'Lịch tự động' },
                      lazy: {
                        Component: async () =>
                          (await import('@/pages/admin/AdminJobsPage')).AdminJobsPage,
                      },
                    },
                    {
                      path: ROUTES.ADMIN.SETTINGS,
                      handle: { crumb: 'Cấu hình' },
                      lazy: {
                        Component: async () =>
                          (await import('@/pages/admin/AdminSettingsPage')).AdminSettingsPage,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}
