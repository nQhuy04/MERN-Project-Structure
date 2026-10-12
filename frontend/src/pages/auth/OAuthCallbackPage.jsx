import { OAuthCallbackStatus } from '@/features/auth';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function OAuthCallbackPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Đăng nhập bằng Google" />
      <OAuthCallbackStatus />
    </div>
  );
}
