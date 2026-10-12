import { Button } from '@/shared/components/ui/Button';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import { AlertTriangleIcon, CheckCircleIcon, ImageIcon, XIcon } from '@/shared/components/ui/icons';

/**
 * Danh sách ảnh đang / vừa tải lên, mỗi ảnh một thanh tiến trình. Ảnh lỗi giữ lại kèm lý do.
 * @param {Object} props
 * @param {Object} props.queue kết quả `useMediaUploadQueue()`
 */
export function UploadQueue({ queue }) {
  if (queue.items.length === 0) return null;

  return (
    <ul
      aria-label="Ảnh đang tải lên"
      className="divide-y divide-line rounded-xl border border-line bg-surface shadow-xs"
    >
      {queue.items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 px-4 py-3 text-sm">
          {item.status === 'done' ? (
            <CheckCircleIcon className="size-5 text-success" />
          ) : item.status === 'error' ? (
            <AlertTriangleIcon className="size-5 text-danger" />
          ) : (
            <ImageIcon className="size-5 text-fg-muted" />
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="flex justify-between gap-3">
              <span className="truncate font-medium">{item.name}</span>
              <span className="shrink-0 text-fg-muted tabular-nums">
                {item.status === 'queued' && 'Đang chờ'}
                {item.status === 'uploading' && `${item.progress}%`}
                {item.status === 'done' && 'Xong'}
              </span>
            </p>
            {item.status === 'error' ? (
              <p role="alert" className="text-danger">
                {item.error}
              </p>
            ) : (
              <ProgressBar value={item.progress} label={`Tiến trình tải ${item.name}`} />
            )}
          </div>
          {(item.status === 'error' || item.status === 'done') && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Ẩn ${item.name}`}
              onClick={() => queue.dismiss(item.id)}
            >
              <XIcon />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
