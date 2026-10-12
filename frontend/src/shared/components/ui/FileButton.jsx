import { useId } from 'react';
import { buttonClassName } from '@/shared/components/ui/Button';
import { Spinner } from '@/shared/components/ui/Spinner';

/**
 * Nút chọn file: `<label>` trông như nút, bọc `<input type="file">` ẩn — bàn phím và trình đọc
 * màn hình dùng như input file thật; nhãn nút là tên của input.
 * @param {Object} props
 * @param {Function} props.onFiles nhận mảng File (đã reset input để chọn lại cùng file được)
 * @param {string} [props.accept]
 * @param {boolean} [props.multiple=false]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.isLoading=false]
 * @param {Function} [props.icon]
 * @param {'primary'|'secondary'|'ghost'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
export function FileButton({
  onFiles,
  accept,
  multiple = false,
  disabled = false,
  isLoading = false,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  className,
  children,
}) {
  const inputId = useId();
  const isDisabled = disabled || isLoading;

  return (
    <label
      htmlFor={inputId}
      className={buttonClassName({
        variant,
        size,
        className: [
          'cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary has-disabled:pointer-events-none has-disabled:opacity-55',
          className,
        ].join(' '),
      })}
    >
      {isLoading ? <Spinner label="" /> : Icon && <Icon />}
      {children}
      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={isDisabled}
        onChange={(event) => {
          const files = [...event.target.files];
          event.target.value = '';
          if (files.length > 0) onFiles(files);
        }}
        className="sr-only"
      />
    </label>
  );
}
