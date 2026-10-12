import { USER_LIST_DEFAULTS } from '@/features/users/constants';
import { useAdminUsers } from '@/features/users/hooks/useAdminUsers';
import { UserFilters } from '@/features/users/components/UserFilters';
import { UsersTable } from '@/features/users/components/UsersTable';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { UsersIcon } from '@/shared/components/ui/icons';
import { useListSearchParams } from '@/shared/hooks/useListSearchParams';

/** Quản lý người dùng: bộ lọc + phân trang trên URL, bảng, thao tác. */
export function UserManagement() {
  const [params, updateParams] = useListSearchParams(USER_LIST_DEFAULTS);
  const usersQuery = useAdminUsers(params);
  const resetFilters = () => updateParams({ q: '', role: '', status: '' });

  return (
    <div className="space-y-4">
      <UserFilters params={params} onChange={updateParams} onReset={resetFilters} />

      {usersQuery.isPending && (
        <div role="status" aria-label="Đang tải danh sách người dùng..." className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      )}

      {usersQuery.isError && (
        <ErrorState
          title="Không tải được danh sách người dùng"
          message={usersQuery.error.message}
          onRetry={() => usersQuery.refetch()}
          isRetrying={usersQuery.isFetching}
        />
      )}

      {usersQuery.isSuccess && usersQuery.data.items.length === 0 && (
        <EmptyState
          icon={UsersIcon}
          title="Không có người dùng nào khớp bộ lọc."
          description="Thử từ khoá khác hoặc xoá bộ lọc."
        />
      )}

      {usersQuery.isSuccess && usersQuery.data.items.length > 0 && (
        <>
          <UsersTable users={usersQuery.data.items} />
          <Pagination meta={usersQuery.data.meta} onPageChange={(page) => updateParams({ page })} />
        </>
      )}
    </div>
  );
}
