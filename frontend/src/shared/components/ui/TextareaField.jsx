import { Field } from '@/shared/components/ui/Field';
import { CONTROL_CLASSES } from '@/shared/components/ui/controlStyles';
import { cn } from '@/shared/lib/cn';

/**
 * Ô nhập nhiều dòng có nhãn và lỗi.
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.error]
 * @param {string} [props.hint]
 * @param {number} [props.rows=4]
 */
export function TextareaField({ label, error, hint, className, rows = 4, ...textareaProps }) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(controlProps) => (
        <textarea
          rows={rows}
          className={cn(CONTROL_CLASSES, 'py-2 leading-relaxed')}
          {...controlProps}
          {...textareaProps}
        />
      )}
    </Field>
  );
}
