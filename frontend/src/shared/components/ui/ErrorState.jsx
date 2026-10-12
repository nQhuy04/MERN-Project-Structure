import { Button } from '@/shared/components/ui/Button';
import { AlertTriangleIcon, RefreshIcon } from '@/shared/components/ui/icons';

/**
 * Trạng thái lỗi có hành động thử lại.
 * @param {Object} props
 * @param {string} [props.title='Đã có lỗi xảy ra']
 * @param {string} props.message
 * @param {Function} [props.onRetry] có thì hiện nút "Thử lại"
 * @param {boolean} [props.isRetrying=false]
 */
export function ErrorState({ title = 'Đã có lỗi xảy ra', message, onRetry, isRetrying = false }) {
  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-danger/20 bg-danger-soft p-4">
      <AlertTriangleIcon className="mt-0.5 text-danger" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-danger">{title}</p>
        <p className="mt-1 text-sm text-fg">{message}</p>
        {onRetry && (
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshIcon}
            className="mt-3"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? 'Đang thử lại...' : 'Thử lại'}
          </Button>
        )}
      </div>
    </div>
  );
}
