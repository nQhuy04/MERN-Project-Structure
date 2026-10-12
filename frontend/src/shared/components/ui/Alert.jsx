import { AlertTriangleIcon, CheckCircleIcon, InfoIcon } from '@/shared/components/ui/icons';
import { cn } from '@/shared/lib/cn';

const TONES = {
  info: { classes: 'border-info/20 bg-info-soft text-info', icon: InfoIcon },
  success: { classes: 'border-success/20 bg-success-soft text-success', icon: CheckCircleIcon },
  warning: { classes: 'border-warning/20 bg-warning-soft text-warning', icon: AlertTriangleIcon },
  danger: { classes: 'border-danger/20 bg-danger-soft text-danger', icon: AlertTriangleIcon },
  neutral: { classes: 'border-line bg-subtle text-fg-muted', icon: InfoIcon },
};

/**
 * Hộp thông báo trong trang (kết quả thao tác, cảnh báo, tính năng chưa cấu hình...).
 * @param {Object} props
 * @param {'info'|'success'|'warning'|'danger'|'neutral'} [props.tone='info']
 * @param {string} [props.title]
 * @param {string} [props.role] `status` (kết quả thành công) | `alert` (lỗi)
 * @param {string} [props.className]
 */
export function Alert({ tone = 'info', title, role, className, children }) {
  const { classes, icon: Icon } = TONES[tone];

  return (
    <div role={role} className={cn('flex gap-3 rounded-lg border p-4 text-sm', classes, className)}>
      <Icon className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-fg">{children}</div>}
      </div>
    </div>
  );
}
