import { AccountSummary } from '@/features/account';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Trang của tôi" />
      <AccountSummary />
    </div>
  );
}
