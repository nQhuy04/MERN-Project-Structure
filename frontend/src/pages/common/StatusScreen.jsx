import { cn } from '@/shared/lib/cn';

/**
 * Màn hình trạng thái toàn trang (404, 403, lỗi không mong muốn).
 * @param {Object} props
 * @param {string} [props.code] mã lớn (404, 403...)
 * @param {Function} [props.icon] icon lớn thay cho mã (lỗi không có mã HTTP)
 * @param {'primary'|'danger'} [props.tone='primary']
 * @param {string} props.title
 * @param {string} props.description
 * @param {*} props.actions
 * @param {string} [props.role]
 */
export function StatusScreen({
  code,
  icon: Icon,
  tone = 'primary',
  title,
  description,
  actions,
  role,
}) {
  return (
    <div
      role={role}
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center text-fg"
    >
      {Icon && (
        <span className="flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Icon className="size-7" />
        </span>
      )}
      {code && (
        <p
          className={cn(
            'text-6xl font-bold tracking-tight tabular-nums',
            tone === 'danger' ? 'text-danger' : 'text-primary',
          )}
        >
          {code}
        </p>
      )}
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-md text-fg-muted">{description}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}
