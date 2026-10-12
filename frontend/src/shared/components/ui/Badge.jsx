import { cn } from '@/shared/lib/cn';

const TONE_CLASSES = {
  neutral: 'bg-subtle text-fg-muted',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

/**
 * Nhãn trạng thái nhỏ (Hoạt động, Bị khoá, Mồ côi, Hệ thống...).
 * @param {Object} props
 * @param {'neutral'|'primary'|'success'|'warning'|'danger'|'info'} [props.tone='neutral']
 * @param {boolean} [props.dot=false] chấm tròn trước chữ
 * @param {string} [props.className]
 */
export function Badge({ tone = 'neutral', dot = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
