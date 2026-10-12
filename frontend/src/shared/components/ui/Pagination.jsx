import { Button } from '@/shared/components/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/components/ui/icons';

/**
 * Điều hướng trang cho danh sách có `meta` chuẩn của API.
 * @param {Object} props
 * @param {Object} props.meta `{ page, totalPages, total }`
 * @param {Function} props.onPageChange nhận số trang mới
 */
export function Pagination({ meta, onPageChange }) {
  if (meta.totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-4 text-sm">
      <p className="text-fg-muted tabular-nums">
        Trang {meta.page} / {meta.totalPages} · {meta.total} kết quả
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronLeftIcon}
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Trang trước
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Trang sau
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  );
}
