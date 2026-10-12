import { Outlet } from 'react-router';
import { useRouteDocumentTitle } from '@/shared/hooks/useRouteMeta';

/** Route gốc: việc chung của mọi trang (tiêu đề tab theo breadcrumb). */
export function RootRoute() {
  useRouteDocumentTitle();
  return <Outlet />;
}
