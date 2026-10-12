import { Link } from 'react-router';
import { APP_NAME } from '@/shared/constants/app';
import { cn } from '@/shared/lib/cn';

/**
 * Logo + tên ứng dụng. Dự án mới thay phần dấu hiệu (ký tự / SVG) và `APP_NAME`.
 * @param {Object} props
 * @param {string} props.to
 * @param {string} [props.caption] chữ nhỏ dưới tên (vd. "Quản trị")
 * @param {string} [props.className]
 */
export function Brand({ to, caption, className }) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5 rounded-lg', className)}>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-on-primary shadow-xs"
      >
        {APP_NAME.charAt(0)}
      </span>
      <span className="leading-tight">
        <span className="block font-semibold tracking-tight text-fg">{APP_NAME}</span>
        {caption && <span className="block text-xs text-fg-muted">{caption}</span>}
      </span>
    </Link>
  );
}
