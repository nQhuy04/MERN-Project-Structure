import { useEffect } from 'react';
import { useMatches } from 'react-router';
import { APP_NAME } from '@/shared/constants/app';

/**
 * Breadcrumb của trang hiện tại, lấy từ `handle.crumb` khai báo trên route — trang không tự dựng
 * breadcrumb. `crumb` là chuỗi hoặc hàm `(match) => chuỗi` (vd. lấy tên từ `match.params`).
 * @returns {Array} `[{ label, to }]` theo thứ tự từ gốc tới trang hiện tại
 */
export function useBreadcrumbs() {
  const matches = useMatches();
  return matches
    .filter((match) => match.handle?.crumb)
    .map((match) => ({
      label:
        typeof match.handle.crumb === 'function' ? match.handle.crumb(match) : match.handle.crumb,
      to: match.pathname,
    }));
}

/**
 * Đặt tiêu đề tab trình duyệt theo breadcrumb cuối: "Người dùng · MERN Base".
 * Gọi một lần ở route gốc.
 */
export function useRouteDocumentTitle() {
  const crumbs = useBreadcrumbs();
  const title = crumbs.at(-1)?.label;

  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
