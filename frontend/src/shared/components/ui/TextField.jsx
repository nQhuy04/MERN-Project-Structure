import { Field } from '@/shared/components/ui/Field';
import { CONTROL_CLASSES, SINGLE_LINE_CLASSES } from '@/shared/components/ui/controlStyles';
import { cn } from '@/shared/lib/cn';

/**
 * Ô nhập có nhãn và lỗi, gắn với react-hook-form qua `{...register('field')}`.
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.error] thông điệp lỗi của trường
 * @param {string} [props.hint] gợi ý hiển thị dưới ô khi không có lỗi
 */
export function TextField({ label, error, hint, className, ...inputProps }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(controlProps) => (
        <input
          className={cn(CONTROL_CLASSES, SINGLE_LINE_CLASSES)}
          {...controlProps}
          {...inputProps}
        />
      )}
    </Field>
  );
}
