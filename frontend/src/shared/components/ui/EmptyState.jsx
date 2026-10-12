import { cn } from '@/shared/lib/cn';

/**
 * Trạng thái rỗng: nói rõ vì sao trống và việc nên làm tiếp (nút hành động).
 * @param {Object} props
 * @param {Function} [props.icon]
 * @param {string} props.title
 * @param {*} [props.description]
 * @param {*} [props.action]
 * @param {string} [props.className]
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line-strong px-6 py-12 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="flex size-11 items-center justify-center rounded-full bg-subtle text-fg-muted">
          <Icon className="size-5" />
        </span>
      )}
      <div className="space-y-1">
        <p className="font-medium text-fg">{title}</p>
        {description && <p className="max-w-sm text-sm text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
