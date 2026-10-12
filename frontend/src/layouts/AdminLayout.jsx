import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { UserMenu, useCurrentUser } from '@/features/auth';
import { Brand } from '@/layouts/Brand';
import { Breadcrumbs } from '@/shared/components/ui/Breadcrumbs';
import { buttonClassName } from '@/shared/components/ui/Button';
import { NavList } from '@/shared/components/ui/NavList';
import {
  ClockIcon,
  ImageIcon,
  LayoutDashboardIcon,
  MenuIcon,
  SlidersIcon,
  UsersIcon,
  XIcon,
} from '@/shared/components/ui/icons';
import { ADMIN_ROLES, USER_ROLES } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';
import { useBreadcrumbs } from '@/shared/hooks/useRouteMeta';

/** Nhóm menu quản trị kèm role được thấy (khớp quyền ở backend và RoleGuard của route). */
const SIDEBAR_GROUPS = [
  {
    label: 'Quản lý',
    items: [
      {
        to: ROUTES.ADMIN.ROOT,
        label: 'Tổng quan',
        icon: LayoutDashboardIcon,
        end: true,
        roles: ADMIN_ROLES,
      },
      { to: ROUTES.ADMIN.USERS, label: 'Người dùng', icon: UsersIcon, roles: ADMIN_ROLES },
      { to: ROUTES.ADMIN.MEDIA, label: 'Thư viện ảnh', icon: ImageIcon, roles: ADMIN_ROLES },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      {
        to: ROUTES.ADMIN.JOBS,
        label: 'Lịch tự động',
        icon: ClockIcon,
        roles: [USER_ROLES.SUPER_ADMIN],
      },
      {
        to: ROUTES.ADMIN.SETTINGS,
        label: 'Cấu hình',
        icon: SlidersIcon,
        roles: [USER_ROLES.SUPER_ADMIN],
      },
    ],
  },
];

/**
 * Nội dung sidebar (dùng cho cả cột cố định trên desktop và ngăn kéo trên mobile).
 * @param {Object} props
 * @param {string} props.role
 * @param {Function} [props.onNavigate]
 */
function SidebarContent({ role, onNavigate }) {
  const groups = SIDEBAR_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Menu quản trị" className="space-y-6">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 text-xs font-medium tracking-wide text-fg-subtle uppercase">
            {group.label}
          </p>
          <NavList items={group.items} onNavigate={onNavigate} />
        </div>
      ))}
    </nav>
  );
}

/**
 * Khung trang khu quản trị: sidebar (cột cố định ≥ lg, ngăn kéo trên mobile) + topbar
 * (breadcrumb, menu tài khoản) + nội dung.
 */
export function AdminLayout() {
  const currentUser = useCurrentUser();
  const crumbs = useBreadcrumbs();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => setIsDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    if (!isDrawerOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsDrawerOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  return (
    <div className="min-h-screen bg-canvas text-fg lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r border-line bg-surface px-3 py-4 lg:flex">
        <Brand to={ROUTES.ADMIN.ROOT} caption="Quản trị" className="px-2" />
        <SidebarContent role={currentUser.role} />
      </aside>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-overlay"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div
            id="admin-drawer"
            className="relative flex h-full w-72 max-w-[85vw] flex-col gap-6 border-r border-line bg-surface px-3 py-4 shadow-2xl"
          >
            <div className="flex items-center justify-between px-2">
              <Brand to={ROUTES.ADMIN.ROOT} caption="Quản trị" />
              <button
                type="button"
                aria-label="Đóng menu"
                onClick={() => setIsDrawerOpen(false)}
                className={buttonClassName({ variant: 'ghost', size: 'icon-sm' })}
              >
                <XIcon />
              </button>
            </div>
            <SidebarContent role={currentUser.role} onNavigate={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:px-8">
          <button
            type="button"
            aria-label="Mở menu quản trị"
            aria-expanded={isDrawerOpen}
            aria-controls="admin-drawer"
            onClick={() => setIsDrawerOpen(true)}
            className={buttonClassName({
              variant: 'ghost',
              size: 'icon-sm',
              className: 'lg:hidden',
            })}
          >
            <MenuIcon />
          </button>
          <Breadcrumbs items={crumbs} />
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
