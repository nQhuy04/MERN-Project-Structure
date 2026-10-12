import { useState } from 'react';
import { useJobRuns } from '@/features/jobs/hooks/useJobs';
import { Badge } from '@/shared/components/ui/Badge';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Spinner } from '@/shared/components/ui/Spinner';
import { formatDateTime } from '@/shared/lib/format';

/**
 * Lịch sử chạy của một job (giữ 90 ngày) — hiển thị trong hộp thoại.
 * @param {Object} props
 * @param {Object} props.job
 */
export function JobRunsPanel({ job }) {
  const [page, setPage] = useState(1);
  const runsQuery = useJobRuns(job.id, page);

  return (
    <div className="space-y-3">
      {runsQuery.isPending && <Spinner label="Đang tải lịch sử..." />}
      {runsQuery.isError && (
        <ErrorState message={runsQuery.error.message} onRetry={() => runsQuery.refetch()} />
      )}
      {runsQuery.isSuccess && runsQuery.data.items.length === 0 && (
        <p className="text-sm text-fg-muted">Job chưa chạy lần nào.</p>
      )}
      {runsQuery.isSuccess && runsQuery.data.items.length > 0 && (
        <>
          <ul className="divide-y divide-line rounded-lg border border-line text-sm">
            {runsQuery.data.items.map((run) => (
              <li key={run.id} className="space-y-1 px-4 py-3">
                <p className="flex flex-wrap items-center justify-between gap-2">
                  <span className="tabular-nums">
                    {formatDateTime(run.startedAt)}
                    {run.isManual && <span className="ml-2 text-xs text-fg-muted">(chạy tay)</span>}
                  </span>
                  {run.status === 'SUCCESS' ? (
                    <Badge tone="success">Thành công</Badge>
                  ) : (
                    <Badge tone="danger">Lỗi</Badge>
                  )}
                </p>
                <p className="font-mono text-xs break-all text-fg-muted">
                  {run.status === 'SUCCESS' ? JSON.stringify(run.result) : run.error}
                </p>
              </li>
            ))}
          </ul>
          <Pagination meta={runsQuery.data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
