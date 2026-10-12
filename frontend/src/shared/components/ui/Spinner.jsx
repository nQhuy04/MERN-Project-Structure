import { cn } from '@/shared/lib/cn';

/**
 * Chỉ báo đang tải. Có `label` → vùng `role="status"` cho trình đọc màn hình; `label` rỗng →
 * chỉ là biểu tượng trang trí (dùng trong nút đã có `aria-busy`). Màu theo chữ xung quanh.
 * @param {Object} props
 * @param {string} [props.label='Đang tải...']
 * @param {string} [props.className]
 */
export function Spinner({ label = 'Đang tải...', className }) {
  const icon = (
    <span
      aria-hidden="true"
      className="size-4 shrink-0 animate-spin rounded-full border-2 border-current/25 border-t-current"
    />
  );

  if (!label) return icon;

  return (
    <div role="status" className={cn('flex items-center gap-2 text-sm text-fg-muted', className)}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
