import { AdminSettingsForm } from '@/features/settings';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Thay đổi có hiệu lực ngay cho mọi người dùng."
      />
      <AdminSettingsForm />
    </div>
  );
}
