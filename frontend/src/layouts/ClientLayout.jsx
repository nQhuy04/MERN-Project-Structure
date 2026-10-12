import { NavLink, Outlet } from 'react-router';
import { UserMenu, useCurrentUser } from '@/features/auth';
import { SETTING_KEYS, usePublicSetting } from '@/features/settings';
import { Brand } from '@/layouts/Brand';
import { Breadcrumbs } from '@/shared/components/ui/Breadcrumbs';
import { ButtonLink } from '@/shared/components/ui/Button';
import { APP_NAME } from '@/shared/constants/app';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/lib/cn';
import { useBreadcrumbs } from '@/shared/hooks/useRouteMeta';

const NAV_ITEMS = [{ to: ROUTES.HOME, label: 'Trang chủ' }];

function navLinkClassName({ isActive }) {
  return cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-subtle text-fg' : 'text-fg-muted hover:text-fg',
  );
}

/** Khung trang khu ứng dụng: header (menu chính, tài khoản) + breadcrumb + nội dung + footer. */
export function ClientLayout() {
  const currentUser = useCurrentUser();
  const isRegistrationEnabled = usePublicSetting(SETTING_KEYS.REGISTRATION_ENABLED) === true;
  const crumbs = useBreadcrumbs();

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Brand to={ROUTES.HOME} />
          <nav aria-label="Menu chính">
            <ul className="flex gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end className={navLinkClassName}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {currentUser ? (
              <UserMenu />
            ) : (
              <>
                <ButtonLink to={ROUTES.AUTH.LOGIN} variant="ghost" size="sm">
                  Đăng nhập
                </ButtonLink>
                {isRegistrationEnabled && (
                  <ButtonLink to={ROUTES.AUTH.REGISTER} size="sm">
                    Đăng ký
                  </ButtonLink>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-8">
        {/* Trang chủ chỉ có 1 cấp → không cần breadcrumb. */}
        {crumbs.length > 1 && <Breadcrumbs items={crumbs} />}
        <Outlet />
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-fg-subtle">
        {APP_NAME} — source base cho khoá học
      </footer>
    </div>
  );
}
