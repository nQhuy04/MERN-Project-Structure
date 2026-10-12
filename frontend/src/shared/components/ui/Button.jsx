import { Link } from 'react-router';
import { Spinner } from '@/shared/components/ui/Spinner';
import { cn } from '@/shared/lib/cn';

const BASE_CLASSES =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors select-none disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55';

const VARIANT_CLASSES = {
  primary: 'bg-primary text-on-primary shadow-xs hover:bg-primary-hover',
  secondary:
    'border border-line bg-surface text-fg shadow-xs hover:border-line-strong hover:bg-subtle',
  ghost: 'text-fg-muted hover:bg-subtle hover:text-fg',
  danger: 'bg-danger text-on-primary shadow-xs hover:bg-danger-hover',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
};

const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'size-9',
  'icon-sm': 'size-8',
};

/**
 * Class của nút — dùng chung cho `<button>`, `<Link>` và `<label>` bọc input file để mọi thứ
 * trông như một nút đều giống hệt nhau.
 * @param {Object} [options]
 * @param {'primary'|'secondary'|'ghost'|'danger'|'danger-ghost'} [options.variant='primary']
 * @param {'sm'|'md'|'lg'|'icon'|'icon-sm'} [options.size='md'] `icon*` = nút vuông chỉ có icon
 *   (bắt buộc kèm `aria-label`)
 * @param {string} [options.className]
 * @returns {string}
 */
export function buttonClassName({ variant = 'primary', size = 'md', className } = {}) {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

/**
 * Nút hành động dùng chung. Mặc định `type="button"` để không vô tình submit form.
 * Quy tắc: mỗi vùng chỉ MỘT nút `primary`; hành động phá huỷ dùng `danger` trong hộp thoại xác
 * nhận hoặc `danger-ghost` trong menu, không đặt nút đỏ to trên từng dòng/thẻ.
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'|'danger-ghost'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'|'icon'|'icon-sm'} [props.size='md']
 * @param {Function} [props.icon] component icon đặt trước chữ
 * @param {boolean} [props.isLoading=false] đang xử lý → khoá nút, spinner thay icon
 * @param {string} [props.className]
 */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon: Icon,
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClassName({ variant, size, className })}
      {...props}
    >
      {isLoading ? <Spinner label="" /> : Icon && <Icon />}
      {children}
    </button>
  );
}

/**
 * Link điều hướng nội bộ trông như nút (vd. "Đăng nhập" sau khi đặt lại mật khẩu).
 * @param {Object} props props của `<Link>` + `variant`, `size`, `icon`
 */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className,
  children,
  ...props
}) {
  return (
    <Link className={buttonClassName({ variant, size, className })} {...props}>
      {Icon && <Icon />}
      {children}
    </Link>
  );
}
