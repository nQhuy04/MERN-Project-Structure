import { ResetPasswordForm } from '@/features/auth';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Đặt mật khẩu mới" />
      <ResetPasswordForm />
    </div>
  );
}
