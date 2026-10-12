import { Link } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { ButtonLink } from '@/shared/components/ui/Button';
import {
  ChevronRightIcon,
  FileIcon,
  LayoutDashboardIcon,
  MonitorIcon,
  PencilIcon,
  ShieldIcon,
  UserIcon,
} from '@/shared/components/ui/icons';
import { ADMIN_ROLES, ROLE_LABELS } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';

/** Tóm tắt tài khoản và lối tắt trên dashboard. */
export function AccountSummary() {
  const currentUser = useCurrentUser();
  const isAdmin = ADMIN_ROLES.includes(currentUser.role);
  const shortcuts = [
    {
      to: ROUTES.ACCOUNT.PROFILE,
      label: 'Hồ sơ cá nhân',
      description: 'Tên hiển thị, ảnh đại diện',
      icon: UserIcon,
    },
    {
      to: ROUTES.ACCOUNT.SECURITY,
      label: 'Bảo mật',
      description: 'Đổi mật khẩu',
      icon: ShieldIcon,
    },
    {
      to: ROUTES.ACCOUNT.SESSIONS,
      label: 'Phiên đăng nhập',
      description: 'Thiết bị đang đăng nhập',
      icon: MonitorIcon,
    },
    {
      to: ROUTES.ACCOUNT.FILES,
      label: 'Tệp của tôi',
      description: 'Ảnh và tài liệu cá nhân',
      icon: FileIcon,
    },
    ...(isAdmin
      ? [
          {
            to: ROUTES.ADMIN.ROOT,
            label: 'Khu quản trị',
            description: 'Người dùng, thư viện ảnh, cấu hình',
            icon: LayoutDashboardIcon,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="account-summary-heading"
        className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-5 shadow-xs"
      >
        <Avatar name={currentUser.name} mediaId={currentUser.avatarMediaId} size="lg" />
        <div className="min-w-0 flex-1 basis-48 space-y-1">
          <h2 id="account-summary-heading" className="text-lg font-semibold">
            Xin chào, {currentUser.name}
          </h2>
          <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            {currentUser.email}
            <Badge tone={isAdmin ? 'primary' : 'neutral'}>{ROLE_LABELS[currentUser.role]}</Badge>
          </p>
        </div>
        <ButtonLink
          to={ROUTES.ACCOUNT.PROFILE}
          variant="secondary"
          icon={PencilIcon}
          className="w-full sm:w-auto"
        >
          Sửa hồ sơ
        </ButtonLink>
      </section>

      <nav aria-label="Lối tắt">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <li key={shortcut.to}>
                <Link
                  to={shortcut.to}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs transition-colors hover:border-line-strong"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-fg">{shortcut.label}</span>
                    <span className="block truncate text-sm text-fg-muted">
                      {shortcut.description}
                    </span>
                  </span>
                  <ChevronRightIcon className="text-fg-subtle transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
