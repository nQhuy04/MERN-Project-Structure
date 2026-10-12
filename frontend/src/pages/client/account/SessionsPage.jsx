import { SessionList } from '@/features/account';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function SessionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Phiên đăng nhập"
        description="Các thiết bị đang đăng nhập vào tài khoản của bạn. Thu hồi phiên lạ nếu nghi ngờ bị lộ mật khẩu."
      />
      <SessionList />
    </div>
  );
}
