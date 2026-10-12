import { AvatarUploader, ProfileForm } from '@/features/account';
import { Card } from '@/shared/components/ui/Card';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Hồ sơ cá nhân" description="Thông tin hiển thị với người khác." />
      <AvatarUploader />
      <Card title="Thông tin cơ bản">
        <ProfileForm />
      </Card>
    </div>
  );
}
