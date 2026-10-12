import { VerifyEmailStatus } from '@/features/auth';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function VerifyEmailPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Xác thực email" />
      <VerifyEmailStatus />
    </div>
  );
}
