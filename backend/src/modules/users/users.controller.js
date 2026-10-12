// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 05.
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { authService } from '../auth/auth.service.js';
import { mediaService } from '../media/media.service.js';
import { usersService } from './users.service.js';

/**
 * **[BÀI 05]** `GET /users/me`. Một dòng: `authenticate` đã đặt sẵn user vào `req.auth.user`,
 * nên chỉ cần `sendSuccess(res, <user đó>)` — không cần truy vấn thêm, không cần message.
 */
async function getMe(req, res) {
  return notImplemented('bai-05');
}

/**
 * **[BÀI 05]** `PATCH /users/me`. Gọi `usersService.updateProfile` với `req.auth.userId` (id của
 * **chính người đang đăng nhập**, không lấy từ body) và `req.validated.body`, rồi
 * `sendSuccess(res, user, 'Cập nhật hồ sơ thành công')`.
 */
async function updateMe(req, res) {
  return notImplemented('bai-05');
}

/**
 * **[BÀI 08]** `PATCH /users/me/password`. Truyền **cả `req.auth`** cho service (nó cần cả
 * `userId` lẫn `sessionId` để biết phiên nào được giữ lại) và `req.validated.body`, rồi
 * `sendSuccess(res, null, 'Đổi mật khẩu thành công. Các thiết bị khác đã bị đăng xuất')`.
 */
async function changeMyPassword(req, res) {
  return notImplemented('bai-08');
}

/** Đặt ảnh đại diện (ảnh do chính user tải vào folder avatars) hoặc bỏ (`mediaId: null`). */
/**
 * **[BÀI 13]** `PATCH /users/me/avatar` — đặt ảnh đại diện, hoặc gỡ bằng `mediaId: null`.
 *
 * Các bước: lấy `mediaId` từ `req.validated.body`; **chỉ khi có `mediaId`** mới gọi
 * `mediaService.assertUsableAsAvatar(req.auth.userId, mediaId)`; rồi
 * `usersService.setAvatar(req.auth.userId, mediaId)`; `sendSuccess` với message
 * `'Đã cập nhật ảnh đại diện'` hoặc `'Đã gỡ ảnh đại diện'` tuỳ theo có `mediaId` hay không.
 */
async function updateMyAvatar(req, res) {
  return notImplemented('bai-13');
}

export const usersController = { getMe, updateMe, changeMyPassword, updateMyAvatar };
