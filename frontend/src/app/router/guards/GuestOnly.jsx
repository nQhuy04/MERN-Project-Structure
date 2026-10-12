import { Navigate, Outlet, useSearchParams } from 'react-router';
import { useCurrentUser } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { getSafeRedirect } from '@/shared/lib/redirect';

/**
 * Trang chỉ dành cho khách (đăng nhập, đăng ký). Đã đăng nhập → chuyển tới `?redirect=` (nếu là
 * đường dẫn nội bộ) hoặc dashboard. Đây cũng là nơi DUY NHẤT điều hướng sau khi đăng nhập thành
 * công: store có user → guard render lại → chuyển trang.
 */
export function GuestOnly() {
  const currentUser = useCurrentUser();
  const [searchParams] = useSearchParams();

  if (currentUser) {
    return (
      <Navigate to={getSafeRedirect(searchParams.get('redirect'), ROUTES.DASHBOARD)} replace />
    );
  }

  return <Outlet />;
}
