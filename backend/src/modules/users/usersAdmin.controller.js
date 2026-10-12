// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 11.
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { sendPaginated, sendSuccess } from '../../shared/utils/response.js';
import { usersAdminService } from './usersAdmin.service.js';

/**
 * **[BÀI 11]** `GET /admin/users`. Gọi service với `req.validated.query`, rồi
 * **`sendPaginated(res, items, meta)`** — không phải `sendSuccess`: danh sách có phân trang dùng
 * định dạng riêng `{ success, data, meta }` (xem `docs/01` mục 2.4).
 */
async function list(req, res) {
  return notImplemented('bai-11');
}

/**
 * **[BÀI 11]** `PATCH /admin/users/:id/lock`. Truyền **`req.auth`** (người thao tác) và
 * `req.validated.params.id` (đối tượng) cho service, rồi
 * `sendSuccess(res, user, 'Đã khoá tài khoản và đăng xuất mọi thiết bị của người dùng')`.
 */
async function lock(req, res) {
  return notImplemented('bai-11');
}

/** **[BÀI 11]** `PATCH /admin/users/:id/unlock`. Như `lock`, message `'Đã mở khoá tài khoản'`. */
async function unlock(req, res) {
  return notImplemented('bai-11');
}

/**
 * **[BÀI 11]** `PATCH /admin/users/:id/role`. Ba tham số: `req.auth`,
 * `req.validated.params.id`, `req.validated.body.role`. Message `'Đã cập nhật vai trò'`.
 */
async function changeRole(req, res) {
  return notImplemented('bai-11');
}

export const usersAdminController = { list, lock, unlock, changeRole };
