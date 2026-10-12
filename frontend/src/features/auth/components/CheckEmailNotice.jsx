import { useSearchParams } from 'react-router';
import { ResendVerificationForm } from '@/features/auth/components/ResendVerificationForm';
import { Alert } from '@/shared/components/ui/Alert';
import { TextLink } from '@/shared/components/ui/TextLink';
import { ROUTES } from '@/shared/constants/routes';

/** Hướng dẫn sau khi đăng ký: mở email để kích hoạt, hoặc gửi lại liên kết. */
export function CheckEmailNotice() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';

  return (
    <div className="space-y-5 text-sm text-fg-muted">
      <Alert tone="info">
        Chúng tôi đã gửi liên kết kích hoạt tới{' '}
        {email ? <strong className="text-fg">{email}</strong> : 'email của bạn'}. Mở email và bấm
        vào liên kết để hoàn tất đăng ký (liên kết có hiệu lực trong 24 giờ).
      </Alert>
      <p>Không thấy email? Kiểm tra thư mục Spam hoặc gửi lại:</p>
      <ResendVerificationForm defaultEmail={email} />
      <p>
        <TextLink to={ROUTES.AUTH.LOGIN}>Quay lại đăng nhập</TextLink>
      </p>
    </div>
  );
}
