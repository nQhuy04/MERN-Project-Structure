import { LoginMethods } from '@/features/auth';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function LoginPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Đăng nhập" description="Chào mừng trở lại! Đăng nhập để tiếp tục." />
      <LoginMethods />
    </div>
  );
}
