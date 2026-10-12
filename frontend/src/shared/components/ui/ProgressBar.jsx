/**
 * Thanh tiến trình (tải lên...).
 * @param {Object} props
 * @param {number} props.value 0–100
 * @param {string} props.label tên cho trình đọc màn hình
 */
export function ProgressBar({ value, label }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-1.5 w-full overflow-hidden rounded-full bg-subtle"
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
