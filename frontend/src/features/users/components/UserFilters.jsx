import { USER_SORT_LABELS, USER_STATUS_LABELS } from '@/features/users/constants';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Select } from '@/shared/components/ui/Select';
import { Toolbar } from '@/shared/components/ui/Toolbar';
import { ROLE_LABELS } from '@/shared/constants/roles';

const toOptions = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Bộ lọc danh sách người dùng — áp dụng ngay (ô tìm kiếm áp dụng khi ngừng gõ).
 * @param {Object} props
 * @param {Object} props.params bộ lọc hiện tại (từ URL)
 * @param {Function} props.onChange nhận các giá trị thay đổi
 * @param {Function} props.onReset xoá mọi bộ lọc
 */
export function UserFilters({ params, onChange, onReset }) {
  const isFiltered = Boolean(params.q || params.role || params.status);

  return (
    <Toolbar label="Lọc người dùng" isFiltered={isFiltered} onReset={onReset}>
      <SearchInput
        label="Tên hoặc email"
        placeholder="Tìm theo tên hoặc email..."
        value={params.q}
        onSearch={(q) => onChange({ q })}
        className="w-full sm:w-72"
      />
      <Select
        aria-label="Vai trò"
        value={params.role}
        onChange={(event) => onChange({ role: event.target.value })}
        options={[{ value: '', label: 'Mọi vai trò' }, ...toOptions(ROLE_LABELS)]}
        className="min-w-36 flex-1 sm:w-40 sm:flex-none"
      />
      <Select
        aria-label="Trạng thái"
        value={params.status}
        onChange={(event) => onChange({ status: event.target.value })}
        options={[{ value: '', label: 'Mọi trạng thái' }, ...toOptions(USER_STATUS_LABELS)]}
        className="min-w-36 flex-1 sm:w-44 sm:flex-none"
      />
      <Select
        aria-label="Sắp xếp"
        value={params.sort}
        onChange={(event) => onChange({ sort: event.target.value })}
        options={toOptions(USER_SORT_LABELS)}
        className="min-w-36 flex-1 sm:w-48 sm:flex-none"
      />
    </Toolbar>
  );
}
