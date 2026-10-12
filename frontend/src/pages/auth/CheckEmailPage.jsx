import { CheckEmailNotice } from '@/features/auth';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function CheckEmailPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Kiểm tra email của bạn" />
      <CheckEmailNotice />
    </div>
  );
}
