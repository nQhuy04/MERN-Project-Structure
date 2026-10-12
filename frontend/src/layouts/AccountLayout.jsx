import { Outlet } from 'react-router';
import { NavList } from '@/shared/components/ui/NavList';
import { FileIcon, MonitorIcon, ShieldIcon, UserIcon } from '@/shared/components/ui/icons';
import { ROUTES } from '@/shared/constants/routes';

const ACCOUNT_NAV_ITEMS = [
  { to: ROUTES.ACCOUNT.PROFILE, label: 'Hồ sơ cá nhân', icon: UserIcon },
  { to: ROUTES.ACCOUNT.SECURITY, label: 'Bảo mật', icon: ShieldIcon },
  { to: ROUTES.ACCOUNT.SESSIONS, label: 'Phiên đăng nhập', icon: MonitorIcon },
  { to: ROUTES.ACCOUNT.FILES, label: 'Tệp của tôi', icon: FileIcon },
];

/** Khung các trang tài khoản: menu con (cột trái ≥ md, tab cuộn ngang trên mobile) + nội dung. */
export function AccountLayout() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-10">
      <NavList
        label="Trang tài khoản"
        items={ACCOUNT_NAV_ITEMS}
        orientation="responsive"
        className="-mx-4 border-b border-line px-4 pb-2 md:mx-0 md:border-0 md:p-0"
      />
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
