/**
 * Đầu trang: tiêu đề (h1 duy nhất của trang), mô tả, hành động chính bên phải.
 * @param {Object} props
 * @param {string} props.title
 * @param {*} [props.description]
 * @param {*} [props.actions]
 */
export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
