import { useEffect, useRef, useState } from 'react';
import { CONTROL_CLASSES, SINGLE_LINE_CLASSES } from '@/shared/components/ui/controlStyles';
import { SearchIcon, XIcon } from '@/shared/components/ui/icons';
import { cn } from '@/shared/lib/cn';

const DEFAULT_DELAY_MS = 300;

/**
 * Ô tìm kiếm tự áp dụng khi ngừng gõ (debounce) — không cần nút "Tìm". Enter áp dụng ngay,
 * nút ✕ xoá nhanh. `value` đổi từ bên ngoài (Back/Forward trên URL) thì ô cập nhật theo.
 * @param {Object} props
 * @param {string} props.value giá trị đang áp dụng (thường lấy từ URL)
 * @param {Function} props.onSearch nhận chuỗi đã trim
 * @param {string} props.label nhãn cho trình đọc màn hình (`aria-label`)
 * @param {string} [props.placeholder]
 * @param {number} [props.delay=300] ms
 * @param {string} [props.className]
 */
export function SearchInput({
  value,
  onSearch,
  label,
  placeholder,
  delay = DEFAULT_DELAY_MS,
  className,
}) {
  const [text, setText] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  // Giá trị áp dụng đổi từ bên ngoài → hiển thị theo (mẫu "điều chỉnh state khi prop đổi").
  if (value !== syncedValue) {
    setSyncedValue(value);
    setText(value);
  }

  useEffect(() => {
    const next = text.trim();
    if (next === value) return undefined;
    const timer = setTimeout(() => onSearchRef.current(next), delay);
    return () => clearTimeout(timer);
  }, [text, value, delay]);

  return (
    <div className={cn('relative', className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle" />
      <input
        type="search"
        value={text}
        aria-label={label}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSearchRef.current(text.trim());
          }
        }}
        className={cn(
          CONTROL_CLASSES,
          SINGLE_LINE_CLASSES,
          'pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {text && (
        <button
          type="button"
          aria-label="Xoá từ khoá"
          onClick={() => {
            setText('');
            onSearchRef.current('');
          }}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-fg-subtle hover:bg-subtle hover:text-fg"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
