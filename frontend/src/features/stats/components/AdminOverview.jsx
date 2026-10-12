import { Link } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { useAdminOverview } from '@/features/stats/hooks/useAdminOverview';
import { Card } from '@/shared/components/ui/Card';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import {
  AlertTriangleIcon,
  ArrowUpRightIcon,
  ClockIcon,
  ImageIcon,
  UsersIcon,
} from '@/shared/components/ui/icons';
import { ROLE_LABELS, USER_ROLES } from '@/shared/constants/roles';
import { ROUTES } from '@/shared/constants/routes';
import { formatDateTime } from '@/shared/lib/format';

/**
 * Thẻ số liệu.
 * @param {Object} props `{ title, value, icon, children, linkTo, linkLabel }`
 */
function StatCard({ title, value, icon: Icon, children, linkTo, linkLabel }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-fg-muted">{title}</h2>
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon />
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <div className="flex-1 space-y-0.5 text-sm text-fg-muted">{children}</div>
      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:text-primary-hover"
        >
          {linkLabel}
          <ArrowUpRightIcon className="size-3.5" />
        </Link>
      )}
    </section>
  );
}

/** Số liệu tổng quan khu quản trị (người dùng, ảnh, lịch tự động). */
export function AdminOverview() {
  const currentUser = useCurrentUser();
  const overviewQuery = useAdminOverview();
  const isSuperAdmin = currentUser.role === USER_ROLES.SUPER_ADMIN;

  if (overviewQuery.isPending) {
    return (
      <div
        role="status"
        aria-label="Đang tải số liệu..."
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
    );
  }
  if (overviewQuery.isError) {
    return (
      <ErrorState
        title="Không tải được số liệu"
        message={overviewQuery.error.message}
        onRetry={() => overviewQuery.refetch()}
        isRetrying={overviewQuery.isFetching}
      />
    );
  }

  const { users, media, jobs } = overviewQuery.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          title="Người dùng"
          value={users.total}
          icon={UsersIcon}
          linkTo={ROUTES.ADMIN.USERS}
          linkLabel="Quản lý người dùng"
        >
          <p>
            Hoạt động {users.byStatus.ACTIVE} · Bị khoá {users.byStatus.LOCKED} · Chưa kích hoạt{' '}
            {users.byStatus.UNVERIFIED}
          </p>
          <p>
            {Object.entries(users.byRole)
              .map(([role, count]) => `${ROLE_LABELS[role]} ${count}`)
              .join(' · ')}
          </p>
        </StatCard>
        <StatCard
          title="Ảnh hệ thống"
          value={media.total}
          icon={ImageIcon}
          linkTo={ROUTES.ADMIN.MEDIA}
          linkLabel="Thư viện ảnh"
        >
          <p>Mồ côi {media.orphans}</p>
        </StatCard>
        <StatCard
          title="Lịch tự động"
          value={jobs.active}
          icon={ClockIcon}
          linkTo={isSuperAdmin ? ROUTES.ADMIN.JOBS : undefined}
          linkLabel="Quản lý lịch"
        >
          <p>Đang bật trên tổng {jobs.total} job</p>
        </StatCard>
      </div>

      {jobs.recentFailures.length > 0 && (
        <Card title="Lần chạy lỗi gần đây" bodyClassName="p-0">
          <ul className="divide-y divide-line text-sm">
            {jobs.recentFailures.map((failure) => (
              <li key={`${failure.jobName}-${failure.startedAt}`} className="flex gap-3 px-5 py-3">
                <AlertTriangleIcon className="mt-0.5 text-danger" />
                <span>
                  <span className="text-fg-muted tabular-nums">
                    {formatDateTime(failure.startedAt)}
                  </span>{' '}
                  · {failure.jobName}: {failure.error}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
