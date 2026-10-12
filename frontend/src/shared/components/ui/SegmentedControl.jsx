import { useRef } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Nhóm lựa chọn loại trừ nhau hiển thị liền khối (vd. Tất cả | Đang dùng | Mồ côi) — nhanh hơn
 * select khi chỉ có 2–5 lựa chọn. Là `radiogroup`: phím mũi tên chuyển lựa chọn.
 * @param {Object} props
 * @param {string} props.label nhãn nhóm (`aria-label`)
 * @param {string} props.value
 * @param {Array} props.options `[{ value, label, count? }]`
 * @param {Function} props.onChange nhận value mới
 * @param {string} [props.className]
 */
export function SegmentedControl({ label, value, options, onChange, className }) {
  const buttonsRef = useRef([]);

  const handleKeyDown = (event, index) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const nextIndex = (index + step + options.length) % options.length;
    onChange(options[nextIndex].value);
    buttonsRef.current[nextIndex]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex h-9 items-center gap-0.5 rounded-lg bg-subtle p-0.5', className)}
    >
      {options.map((option, index) => {
        const isChecked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={isChecked}
            tabIndex={isChecked ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'inline-flex h-full items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors',
              isChecked ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="text-xs text-fg-subtle tabular-nums">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
