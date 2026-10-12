import { Navigate, useSearchParams } from 'react-router';
import { useMagicLinkLogin } from '@/features/auth/hooks/useMagicLink';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Spinner } from '@/shared/components/ui/Spinner';
import { TextLink } from '@/shared/components/ui/TextLink';
import { ROUTES } from '@/shared/constants/routes';

/** Đăng nhập bằng token trên URL; thành công → vào dashboard. */
export function MagicLinkStatus() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isSuccess, isError, error } = useMagicLinkLogin(token);

  if (!token) {
    return (
      <ErrorState title="Thiếu liên kết đăng nhập" message="Hãy mở đúng liên kết trong email." />
    );
  }
  if (isSuccess) return <Navigate to={ROUTES.DASHBOARD} replace />;
  if (isError) {
    return (
      <div className="space-y-4">
        <ErrorState title="Không thể đăng nhập" message={error.message} />
        <p className="text-sm">
          <TextLink to={ROUTES.AUTH.LOGIN}>Về trang đăng nhập</TextLink>
        </p>
      </div>
    );
  }
  return <Spinner label="Đang đăng nhập..." />;
}
