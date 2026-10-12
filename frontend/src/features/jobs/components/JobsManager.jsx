import { useState } from 'react';
import { toast } from 'sonner';
import { JobForm } from '@/features/jobs/components/JobForm';
import { JobRunsPanel } from '@/features/jobs/components/JobRunsPanel';
import {
  useDeleteJob,
  useJobTypes,
  useJobs,
  useRunJob,
  useSetJobPaused,
} from '@/features/jobs/hooks/useJobs';
import { describeSchedule } from '@/features/jobs/schedule';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Dialog } from '@/shared/components/ui/Dialog';
import { DropdownMenu } from '@/shared/components/ui/DropdownMenu';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Table, TableCell, TableHeaderCell } from '@/shared/components/ui/Table';
import {
  ClockIcon,
  HistoryIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from '@/shared/components/ui/icons';
import { formatDateTime } from '@/shared/lib/format';

const PAGE_TITLE = 'Lịch tự động';
const PAGE_DESCRIPTION =
  'Job hệ thống không xoá được, chỉ tạm dừng. Giờ chạy tính theo múi giờ cấu hình trên máy chủ.';

/**
 * Cột "Lần gần nhất".
 * @param {Object} props
 * @param {Object} props.job
 */
function LastRun({ job }) {
  if (job.isRunning) return <Badge tone="info">Đang chạy...</Badge>;
  if (!job.lastRunAt) return <span className="text-fg-muted">Chưa chạy</span>;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Badge tone={job.lastRunStatus === 'SUCCESS' ? 'success' : 'danger'} dot>
        {job.lastRunStatus === 'SUCCESS' ? 'Thành công' : 'Lỗi'}
      </Badge>
      <span className="text-fg-muted tabular-nums">{formatDateTime(job.lastRunAt)}</span>
    </span>
  );
}

/** Quản lý lịch tự động: danh sách, tạo / sửa, chạy ngay, tạm dừng, xoá, lịch sử. */
export function JobsManager() {
  const jobsQuery = useJobs();
  const typesQuery = useJobTypes();
  const runMutation = useRunJob();
  const pauseMutation = useSetJobPaused();
  const deleteMutation = useDeleteJob();
  // null = đóng; { mode: 'create' } | { mode: 'edit', job }
  const [form, setForm] = useState(null);
  const [historyJob, setHistoryJob] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const isReady = jobsQuery.isSuccess && typesQuery.isSuccess;

  const header = (
    <PageHeader
      title={PAGE_TITLE}
      description={PAGE_DESCRIPTION}
      actions={
        isReady && (
          <Button icon={PlusIcon} onClick={() => setForm({ mode: 'create' })}>
            Tạo job
          </Button>
        )
      }
    />
  );

  if (jobsQuery.isPending || typesQuery.isPending) {
    return (
      <div className="space-y-6">
        {header}
        <div role="status" aria-label="Đang tải lịch tự động..." className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      </div>
    );
  }
  if (jobsQuery.isError || typesQuery.isError) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState
          title="Không tải được lịch tự động"
          message={(jobsQuery.error ?? typesQuery.error).message}
          onRetry={() => {
            jobsQuery.refetch();
            typesQuery.refetch();
          }}
        />
      </div>
    );
  }

  const typeLabels = Object.fromEntries(typesQuery.data.map((type) => [type.type, type.label]));
  const notify = {
    onSuccess: (body) => toast.success(body.message),
    onError: (error) => toast.error(error.message),
  };

  const buildRowActions = (job) => [
    {
      label: job.isPaused ? 'Tiếp tục' : 'Tạm dừng',
      icon: job.isPaused ? PlayIcon : PauseIcon,
      onSelect: () => pauseMutation.mutate({ jobId: job.id, isPaused: !job.isPaused }, notify),
    },
    { label: 'Sửa', icon: PencilIcon, onSelect: () => setForm({ mode: 'edit', job }) },
    { label: 'Lịch sử chạy', icon: HistoryIcon, onSelect: () => setHistoryJob(job) },
    ...(job.isSystem
      ? []
      : [
          { type: 'separator' },
          { label: 'Xoá', icon: TrashIcon, tone: 'danger', onSelect: () => setJobToDelete(job) },
        ]),
  ];

  return (
    <div className="space-y-6">
      {header}

      {jobsQuery.data.length === 0 ? (
        <EmptyState
          icon={ClockIcon}
          title="Chưa có job nào"
          description="Tạo job để gửi email định kỳ hoặc chạy tác vụ theo lịch."
        />
      ) : (
        <Table
          caption="Danh sách job"
          head={
            <>
              <TableHeaderCell>Job</TableHeaderCell>
              <TableHeaderCell>Lịch</TableHeaderCell>
              <TableHeaderCell>Lần chạy tới</TableHeaderCell>
              <TableHeaderCell>Lần gần nhất</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Thao tác</span>
              </TableHeaderCell>
            </>
          }
        >
          {jobsQuery.data.map((job) => (
            <tr key={job.id}>
              <TableCell>
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {job.name}
                  {job.isSystem && <Badge>Hệ thống</Badge>}
                </p>
                {/* Tên trùng tên loại (job hệ thống) → không lặp lại. */}
                {typeLabels[job.type] !== job.name && (
                  <p className="text-xs text-fg-muted">{typeLabels[job.type] ?? job.type}</p>
                )}
              </TableCell>
              <TableCell>{describeSchedule(job.schedule)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {job.isPaused ? (
                  <Badge tone="warning">Tạm dừng</Badge>
                ) : job.nextRunAt ? (
                  <span className="tabular-nums">{formatDateTime(job.nextRunAt)}</span>
                ) : (
                  <span className="text-fg-muted">Đã xong</span>
                )}
              </TableCell>
              <TableCell>
                <LastRun job={job} />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={PlayIcon}
                    disabled={runMutation.isPending}
                    onClick={() => runMutation.mutate(job.id, notify)}
                  >
                    Chạy ngay
                  </Button>
                  <DropdownMenu
                    label={`Thao tác với ${job.name}`}
                    trigger={<MoreHorizontalIcon />}
                    items={buildRowActions(job)}
                  />
                </div>
              </TableCell>
            </tr>
          ))}
        </Table>
      )}

      <Dialog
        isOpen={form !== null}
        onClose={() => setForm(null)}
        title={form?.job ? `Sửa job: ${form.job.name}` : 'Tạo job mới'}
        size="lg"
      >
        {form && (
          <JobForm
            key={form.job?.id ?? 'new'}
            types={typesQuery.data}
            job={form.job}
            onDone={() => setForm(null)}
          />
        )}
      </Dialog>

      <Dialog
        isOpen={historyJob !== null}
        onClose={() => setHistoryJob(null)}
        title={`Lịch sử chạy: ${historyJob?.name ?? ''}`}
        size="lg"
      >
        {historyJob && <JobRunsPanel key={historyJob.id} job={historyJob} />}
      </Dialog>

      <ConfirmDialog
        isOpen={jobToDelete !== null}
        title="Xoá job?"
        description={`Job "${jobToDelete?.name}" và toàn bộ lịch sử chạy sẽ bị xoá.`}
        confirmLabel="Xoá"
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleteMutation.mutate(jobToDelete.id, {
            ...notify,
            onSettled: () => setJobToDelete(null),
          })
        }
        onCancel={() => setJobToDelete(null)}
      />
    </div>
  );
}
