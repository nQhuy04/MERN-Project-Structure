import { ForgotPasswordForm } from '@/features/auth';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quên mật khẩu"
        description="Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để đặt mật khẩu mới."
      />
      <ForgotPasswordForm />
    </div>
  );
}
