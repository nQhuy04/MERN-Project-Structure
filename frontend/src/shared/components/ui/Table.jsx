import { cn } from '@/shared/lib/cn';

/**
 * Bảng dữ liệu: khung cuộn ngang trên màn hẹp, tiêu đề cột nhạt, dòng có hover.
 * Dùng cùng `TableHeaderCell` / `TableCell`.
 * @param {Object} props
 * @param {string} props.caption mô tả bảng cho trình đọc màn hình
 * @param {*} props.head các `<TableHeaderCell>` của dòng tiêu đề
 * @param {string} [props.className]
 */
export function Table({ caption, head, className, children }) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border border-line bg-surface shadow-xs',
        className,
      )}
    >
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line bg-canvas text-xs font-medium text-fg-muted">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-line [&>tr]:transition-colors [&>tr:hover]:bg-canvas">
          {children}
        </tbody>
      </table>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 */
export function TableHeaderCell({ className, children }) {
  return (
    <th scope="col" className={cn('px-4 py-2.5 font-medium whitespace-nowrap', className)}>
      {children}
    </th>
  );
}

/**
 * @param {Object} props
 * @param {string} [props.className]
 */
export function TableCell({ className, children }) {
  return <td className={cn('px-4 py-3 align-middle', className)}>{children}</td>;
}
