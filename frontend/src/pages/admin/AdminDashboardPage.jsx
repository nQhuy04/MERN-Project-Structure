import { AdminOverview } from '@/features/stats';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tổng quan" description="Tình hình hệ thống tại thời điểm hiện tại." />
      <AdminOverview />
    </div>
  );
}
