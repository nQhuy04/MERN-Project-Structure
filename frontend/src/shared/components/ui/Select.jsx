import { Field } from '@/shared/components/ui/Field';
import { CONTROL_CLASSES, SINGLE_LINE_CLASSES } from '@/shared/components/ui/controlStyles';
import { ChevronDownIcon } from '@/shared/components/ui/icons';
import { cn } from '@/shared/lib/cn';

/**
 * Select gốc của trình duyệt (bàn phím, mobile, trình đọc màn hình đều tốt sẵn) được tạo kiểu.
 * Dùng trong thanh công cụ thì đặt `aria-label` thay cho nhãn hiển thị.
 * @param {Object} props
 * @param {Array} [props.options] `[{ value, label, disabled }]` — hoặc truyền `<option>` qua children
 * @param {string} [props.className] class của khung bọc (vd. độ rộng)
 */
export function Select({ options, className, children, ...selectProps }) {
  return (
    <div className={cn('relative', className)}>
      <select
        className={cn(CONTROL_CLASSES, SINGLE_LINE_CLASSES, 'cursor-pointer appearance-none pr-9')}
        {...selectProps}
      >
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fg-subtle" />
    </div>
  );
}

/**
 * Select có nhãn và lỗi (dùng trong form).
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.error]
 * @param {string} [props.hint]
 * @param {Array} [props.options]
 */
export function SelectField({ label, error, hint, className, ...selectProps }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(controlProps) => <Select {...controlProps} {...selectProps} />}
    </Field>
  );
}
