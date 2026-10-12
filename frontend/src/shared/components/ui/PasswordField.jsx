import { useState } from 'react';
import { Field } from '@/shared/components/ui/Field';
import { CONTROL_CLASSES, SINGLE_LINE_CLASSES } from '@/shared/components/ui/controlStyles';
import { EyeIcon, EyeOffIcon } from '@/shared/components/ui/icons';
import { cn } from '@/shared/lib/cn';

/**
 * Ô mật khẩu có nút ẩn/hiện (icon con mắt).
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.error]
 * @param {string} [props.hint]
 */
export function PasswordField({ label, error, hint, className, ...inputProps }) {
  const [isVisible, setIsVisible] = useState(false);
  const ToggleIcon = isVisible ? EyeOffIcon : EyeIcon;

  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(controlProps) => (
        <div className="relative">
          <input
            type={isVisible ? 'text' : 'password'}
            className={cn(CONTROL_CLASSES, SINGLE_LINE_CLASSES, 'pr-10')}
            {...controlProps}
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-controls={controlProps.id}
            aria-pressed={isVisible}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-fg-subtle transition-colors hover:text-fg"
          >
            <ToggleIcon />
          </button>
        </div>
      )}
    </Field>
  );
}
