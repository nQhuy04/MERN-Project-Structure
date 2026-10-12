import { Button } from '@/shared/components/ui/Button';
import { XIcon } from '@/shared/components/ui/icons';
import { cn } from '@/shared/lib/cn';

/**
 * Thanh công cụ của trang danh sách: ô tìm kiếm + bộ lọc áp dụng ngay (không nút "Tìm") + nút
 * "Xoá bộ lọc" khi đang lọc + hành động bên phải.
 * @param {Object} props
 * @param {string} props.label `aria-label` của vùng tìm kiếm (vd. "Lọc người dùng")
 * @param {boolean} [props.isFiltered=false] có bộ lọc đang áp dụng → hiện "Xoá bộ lọc"
 * @param {Function} [props.onReset]
 * @param {*} [props.actions] nút đặt bên phải (vd. "Dọn ảnh mồ côi")
 * @param {string} [props.className]
 */
export function Toolbar({ label, isFiltered = false, onReset, actions, className, children }) {
  return (
    <div className={cn('flex flex-wrap items-start gap-2', className)}>
      <div role="search" aria-label={label} className="flex flex-1 flex-wrap items-center gap-2">
        {children}
        {isFiltered && onReset && (
          <Button variant="ghost" size="sm" icon={XIcon} onClick={onReset}>
            Xoá bộ lọc
          </Button>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
