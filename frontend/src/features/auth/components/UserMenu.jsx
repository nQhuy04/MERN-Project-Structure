import { useLogout } from '@/features/auth/hooks/useLogout';
import { useCurrentUser } from '@/features/auth/store/authStore';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { DropdownMenu } from '@/shared/components/ui/DropdownMenu';
import {
  ChevronDownIcon,
  FileIcon,
  HomeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MonitorIcon,
  ShieldIcon,
  UserIcon,
} from '@/shared/components/ui/icons';
import { ADMIN_ROLES, ROLE_LABELS } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';

/**
 * Menu tài khoản ở header — dùng chung cho khu người dùng và khu quản trị (quản trị viên cũng
 * là người dùng: vẫn cần hồ sơ, bảo mật, phiên đăng nhập, đăng xuất).
 */
export function UserMenu() {
  const currentUser = useCurrentUser();
  const { logout, isPending: isLoggingOut } = useLogout();
  const isAdmin = ADMIN_ROLES.includes(currentUser.role);

  const items = [
    { label: 'Trang của tôi', icon: HomeIcon, to: ROUTES.DASHBOARD },
    { label: 'Hồ sơ cá nhân', icon: UserIcon, to: ROUTES.ACCOUNT.PROFILE },
    { label: 'Tệp của tôi', icon: FileIcon, to: ROUTES.ACCOUNT.FILES },
    { label: 'Bảo mật', icon: ShieldIcon, to: ROUTES.ACCOUNT.SECURITY },
    { label: 'Phiên đăng nhập', icon: MonitorIcon, to: ROUTES.ACCOUNT.SESSIONS },
    ...(isAdmin
      ? [
          { type: 'separator' },
          { label: 'Quản trị', icon: LayoutDashboardIcon, to: ROUTES.ADMIN.ROOT },
        ]
      : []),
    { type: 'separator' },
    {
      label: isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất',
      icon: LogOutIcon,
      tone: 'danger',
      disabled: isLoggingOut,
      onSelect: logout,
    },
  ];

  return (
    <DropdownMenu
      label={`Tài khoản: ${currentUser.name}`}
      triggerClassName="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 text-sm text-fg transition-colors hover:bg-subtle aria-expanded:bg-subtle"
      trigger={
        <>
          <Avatar name={currentUser.name} mediaId={currentUser.avatarMediaId} isDecorative />
          <span className="hidden max-w-40 truncate font-medium sm:inline">{currentUser.name}</span>
          <ChevronDownIcon className="hidden text-fg-subtle sm:block" />
        </>
      }
      header={
        <div className="flex items-center gap-3">
          <Avatar
            name={currentUser.name}
            mediaId={currentUser.avatarMediaId}
            size="md"
            isDecorative
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{currentUser.name}</p>
            <p className="truncate text-xs text-fg-muted">{currentUser.email}</p>
            <Badge tone={isAdmin ? 'primary' : 'neutral'} className="mt-1">
              {ROLE_LABELS[currentUser.role]}
            </Badge>
          </div>
        </div>
      }
      items={items}
    />
  );
}
