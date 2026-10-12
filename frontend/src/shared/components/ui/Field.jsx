import { useId } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Khung một trường form: nhãn, ô nhập, gợi ý / lỗi — nối sẵn `id`, `aria-invalid`,
 * `aria-describedby`. Mọi ô nhập của dự án đi qua đây để trình bày thống nhất.
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.error] thông điệp lỗi (ưu tiên hơn `hint`)
 * @param {string} [props.hint] gợi ý dưới ô khi không có lỗi
 * @param {string} [props.className]
 * @param {Function} props.children `(controlProps) => element` — trải `controlProps` vào ô nhập
 */
export function Field({ label, error, hint, className, children }) {
  const controlId = useId();
  const messageId = `${controlId}-message`;
  const message = error ?? hint;

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={controlId} className="block text-sm font-medium text-fg">
        {label}
      </label>
      {children({
        id: controlId,
        'aria-invalid': Boolean(error),
        'aria-describedby': message ? messageId : undefined,
      })}
      {message && (
        <p id={messageId} className={cn('text-xs', error ? 'text-danger' : 'text-fg-muted')}>
          {message}
        </p>
      )}
    </div>
  );
}
