import { UserManagement } from '@/features/users';
import { PageHeader } from '@/shared/components/ui/PageHeader';

export function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Người dùng"
        description="Tìm kiếm, khoá / mở khoá tài khoản và phân quyền quản trị."
      />
      <UserManagement />
    </div>
  );
}
