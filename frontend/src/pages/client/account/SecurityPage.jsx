import { ChangePasswordForm } from '@/features/auth';
import { Card } from '@/shared/components/ui/Card';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Bảo mật" />
      <Card
        title="Đổi mật khẩu"
        description="Đổi mật khẩu sẽ đăng xuất mọi thiết bị khác, thiết bị này vẫn giữ đăng nhập."
      >
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
