import { useHealth } from '@/features/health/hooks/useHealth';
import { Badge } from '@/shared/components/ui/Badge';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Spinner } from '@/shared/components/ui/Spinner';
import { ERROR_CODES } from '@/shared/constants/errorCodes';

const ERROR_TITLES = {
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'API đang chạy nhưng cơ sở dữ liệu không phản hồi',
  [ERROR_CODES.NETWORK_ERROR]: 'Không kết nối được API',
};

/** Thẻ hiển thị trạng thái API và database (kiểm tra kết nối FE ↔ BE). */
export function ApiStatusCard() {
  const { data, error, isPending, isError, refetch, isFetching } = useHealth();

  if (isPending) return <Spinner label="Đang kiểm tra kết nối API..." />;

  if (isError) {
    return (
      <ErrorState
        title={ERROR_TITLES[error.code] ?? 'Không kiểm tra được trạng thái hệ thống'}
        message={error.message}
        onRetry={() => refetch()}
        isRetrying={isFetching}
      />
    );
  }

  const stats = [
    { label: 'API', value: data.status },
    { label: 'Database', value: data.database },
    { label: 'Uptime', value: `${data.uptime} giây` },
  ];

  return (
    <section
      aria-labelledby="api-status-heading"
      className="space-y-4 rounded-xl border border-line bg-surface p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="api-status-heading" className="font-semibold">
          Hệ thống hoạt động bình thường
        </h2>
        <Badge tone="success" dot>
          Trực tuyến
        </Badge>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-canvas px-4 py-3">
            <dt className="text-xs text-fg-muted">{stat.label}</dt>
            <dd className="mt-1 font-medium tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
