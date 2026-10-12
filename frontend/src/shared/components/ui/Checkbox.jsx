import { cn } from '@/shared/lib/cn';

/**
 * Checkbox / radio có nhãn bên phải. Dùng `type="radio"` cho radio.
 * @param {Object} props
 * @param {*} props.label
 * @param {'checkbox'|'radio'} [props.type='checkbox']
 */
export function Checkbox({ label, type = 'checkbox', className, ...inputProps }) {
  return (
    <label
      className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-fg', className)}
    >
      <input type={type} className="size-4 cursor-pointer accent-primary" {...inputProps} />
      {label}
    </label>
  );
}
