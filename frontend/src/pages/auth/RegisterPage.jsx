import { GoogleLoginButton, RegisterForm } from '@/features/auth';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function RegisterPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tạo tài khoản" description="Chỉ mất một phút để bắt đầu." />
      <GoogleLoginButton />
      <RegisterForm />
    </div>
  );
}
