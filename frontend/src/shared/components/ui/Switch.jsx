import { cn } from '@/shared/lib/cn';

/**
 * Công tắc bật/tắt — bản chất là checkbox `role="switch"` (bàn phím, form, test dùng như checkbox).
 * Nhãn đặt bên ngoài bằng `<label htmlFor={id}>`.
 * @param {Object} props props của `<input type="checkbox">` (`id`, `checked`, `onChange`...)
 */
export function Switch({ className, ...inputProps }) {
  return (
    // <label> bọc ngoài để bấm vào rãnh cũng bật/tắt; nhãn chữ vẫn là <label htmlFor> bên ngoài.
    <label className={cn('relative inline-flex shrink-0', className)}>
      <input type="checkbox" role="switch" className="peer sr-only" {...inputProps} />
      <span
        aria-hidden="true"
        className="h-5 w-9 cursor-pointer rounded-full bg-line-strong transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-55 after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-surface after:shadow-sm after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  );
}
