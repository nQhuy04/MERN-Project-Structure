import { useId } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Khối nội dung nền trắng có viền. Có `title` → phần đầu (tiêu đề, mô tả, hành động) và vùng
 * `<section>` được đặt tên theo tiêu đề cho trình đọc màn hình.
 * @param {Object} props
 * @param {string} [props.title]
 * @param {*} [props.description]
 * @param {*} [props.actions] nút đặt bên phải tiêu đề
 * @param {string} [props.className]
 * @param {string} [props.bodyClassName='p-5'] đặt `p-0` khi thân là bảng / danh sách sát viền
 */
export function Card({ title, description, actions, className, bodyClassName = 'p-5', children }) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={cn('rounded-xl border border-line bg-surface shadow-xs', className)}
    >
      {title && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 space-y-0.5">
            <h2 id={headingId} className="text-base font-semibold text-fg">
              {title}
            </h2>
            {description && <p className="text-sm text-fg-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
