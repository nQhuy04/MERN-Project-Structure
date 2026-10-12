import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Trạng thái bộ lọc + trang của một danh sách, lưu trên URL (?q=&role=&page=) → chia sẻ link,
 * F5, nút Back đều giữ nguyên bộ lọc.
 * @param {Object} defaults giá trị mặc định cho từng tham số (vd. `{ q: '', page: 1 }`) — khai báo
 *   là hằng số NGOÀI component để không bị tạo lại mỗi lần render
 * @returns {Array} `[params, updateParams]` — `updateParams(changes)` đổi tham số; đổi bất kỳ
 *   bộ lọc nào (không phải `page`) thì quay về trang 1
 */
export function useListSearchParams(defaults) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const result = {};
    for (const [key, defaultValue] of Object.entries(defaults)) {
      const raw = searchParams.get(key);
      result[key] =
        raw === null ? defaultValue : typeof defaultValue === 'number' ? Number(raw) : raw;
    }
    return result;
  }, [searchParams, defaults]);

  const updateParams = useCallback(
    (changes) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        const isFilterChange = Object.keys(changes).some((key) => key !== 'page');
        const merged = isFilterChange ? { ...changes, page: defaults.page } : changes;

        for (const [key, value] of Object.entries(merged)) {
          // Giá trị bằng mặc định hoặc rỗng → bỏ khỏi URL cho gọn.
          if (value === '' || value === undefined || value === defaults[key]) next.delete(key);
          else next.set(key, String(value));
        }
        return next;
      });
    },
    [setSearchParams, defaults],
  );

  return [params, updateParams];
}
