import { useSearchParams } from 'react-router';
import { useVerifyEmail } from '@/features/auth/hooks/useVerifyEmail';
import { Alert } from '@/shared/components/ui/Alert';
import { ButtonLink } from '@/shared/components/ui/Button';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Spinner } from '@/shared/components/ui/Spinner';
import { TextLink } from '@/shared/components/ui/TextLink';
import { ROUTES } from '@/shared/constants/routes';

/** Xác thực email bằng token trên URL và hiển thị kết quả. */
export function VerifyEmailStatus() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isSuccess, isError, error } = useVerifyEmail(token);

  if (!token) {
    return (
      <ErrorState
        title="Thiếu liên kết xác thực"
        message="Hãy mở đúng liên kết trong email xác thực."
      />
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <ErrorState title="Không thể xác thực email" message={error.message} />
        <p className="text-sm text-fg-muted">
          Liên kết chỉ dùng được một lần và có hạn 24 giờ. Nhận liên kết mới tại trang{' '}
          <TextLink to={ROUTES.AUTH.CHECK_EMAIL}>gửi lại email xác thực</TextLink>.
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <Alert tone="success" role="status">
          Xác thực email thành công. Tài khoản của bạn đã được kích hoạt.
        </Alert>
        <ButtonLink to={ROUTES.AUTH.LOGIN} className="w-full">
          Đăng nhập
        </ButtonLink>
      </div>
    );
  }

  return <Spinner label="Đang xác thực email..." />;
}
