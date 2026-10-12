import { cn } from '@/shared/lib/cn';

/**
 * Khối giữ chỗ khi đang tải — giữ bố cục ổn định thay vì nhảy từ spinner sang nội dung.
 * Đặt kích thước bằng `className` (vd. `h-4 w-32`, `aspect-square`).
 * @param {Object} props
 * @param {string} [props.className]
 */
export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-subtle', className)} />;
}
