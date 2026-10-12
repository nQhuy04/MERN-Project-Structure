import { MagicLinkStatus } from '@/features/auth';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function MagicLinkPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Đăng nhập bằng liên kết" />
      <MagicLinkStatus />
    </div>
  );
}
