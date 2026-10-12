// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 11.
import { http } from '@/shared/lib/http';
import { notImplemented } from '@/shared/lib/practice';

/** Query key factory của feature users (quản trị người dùng). */
export const usersKeys = {
  all: ['admin-users'],
  list: (params) => [...usersKeys.all, 'list', params],
};

/**
 * **[BÀI 11]** Gọi `GET /admin/users`.
 *
 * Khác các hàm API trước ở **hai** chỗ:
 * 1. **Bỏ tham số rỗng trước khi gửi**: `Object.fromEntries(Object.entries(params).filter(([,
 *    value]) => value !== ''))`. Gửi `role=''` lên thì Zod của backend từ chối; bỏ hẳn tham số đi
 *    mới có nghĩa "không lọc".
 * 2. Trả `{ items: response.data.data, meta: response.data.meta }` — response phân trang có
 *    thêm `meta` nằm **ngang hàng** với `data`.
 *
 * @param {Object} params `{ q, role, status, sort, page, limit }` — giá trị rỗng không gửi
 * @returns {Promise} resolve `{ items, meta }`
 */
export async function listUsers(params) {
  return notImplemented('bai-11');
}

/** @param {string} userId @returns {Promise} resolve body response */
export async function lockUser(userId) {
  return notImplemented('bai-11');
}

/** @param {string} userId @returns {Promise} resolve body response */
export async function unlockUser(userId) {
  return notImplemented('bai-11');
}

/**
 * @param {Object} params `{ userId, role }` — role MEMBER | ADMIN
 * @returns {Promise} resolve body response
 */
export async function changeUserRole({ userId, role }) {
  return notImplemented('bai-11');
}
