// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 13.
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { sendCreated, sendPaginated, sendSuccess } from '../../shared/utils/response.js';
import { AVATAR_FOLDER } from './media.constants.js';
import { mediaService } from './media.service.js';

// Ngắn hơn hạn presigned URL (5 phút) để trình duyệt không dùng lại URL đã hết hạn.
const CONTENT_CACHE_SECONDS = 4 * 60;

/**
 * **[BÀI 13]** `GET /media/:id/content` — endpoint **công khai** hiển thị ảnh.
 *
 * Các bước: `mediaService.getContentUrl(req.validated.params.id)`, đặt hai header, rồi
 * `res.redirect(302, url)`:
 * - `Cache-Control: public, max-age=CONTENT_CACHE_SECONDS` — cache **ngắn hơn** hạn của presigned
 *   URL (5 phút), để trình duyệt không dùng lại một URL đã hết hạn;
 * - `Cross-Origin-Resource-Policy: cross-origin` — helmet mặc định đặt `same-origin`, khiến
 *   frontend ở origin khác **không nhúng được** ảnh này vào thẻ `<img>`.
 *
 * ⚠️ Redirect chứ không proxy: backend không tải ảnh về rồi gửi lại, nó chỉ chỉ đường sang R2.
 */
async function redirectToContent(req, res) {
  return notImplemented('bai-13');
}

/**
 * **[BÀI 13]** `POST /admin/media/presign`. Một dòng: `sendCreated` với kết quả
 * `mediaService.requestLibraryUpload` — hàm có sẵn, kiểm thư mục đã được tạo rồi gọi
 * `requestUpload` của bạn.
 */
async function requestUpload(req, res) {
  return notImplemented('bai-13');
}

/** Thành viên tải ảnh đại diện: luôn vào folder avatars. */
/**
 * **[BÀI 13]** `POST /media/avatar/presign` — thành viên tải ảnh đại diện.
 *
 * Gọi cùng `mediaService.requestUpload`, nhưng **ép `folder: AVATAR_FOLDER`**, ghi đè bất cứ giá
 * trị nào client gửi lên. Nhờ vậy thành viên thường không đẩy được ảnh vào folder hệ thống, và
 * `assertUsableAsAvatar` sau này chỉ cần kiểm đúng một folder.
 */
async function requestAvatarUpload(req, res) {
  return notImplemented('bai-13');
}

/** **[BÀI 13]** `POST /media/:id/complete`. Message `'Tải ảnh lên thành công'`. */
async function completeUpload(req, res) {
  return notImplemented('bai-13');
}

/** **[BÀI 13]** `GET /admin/media`. Danh sách phân trang → `sendPaginated`. */
async function list(req, res) {
  return notImplemented('bai-13');
}

/** **[BÀI 13]** `GET /admin/media/folders`. Một dòng. */
async function listFolders(_req, res) {
  return notImplemented('bai-13');
}

async function createFolder(req, res) {
  const folder = await mediaService.createFolder(req.auth.userId, req.validated.body.name);
  sendCreated(res, folder, 'Đã tạo thư mục');
}

async function deleteFolder(req, res) {
  await mediaService.deleteFolder(req.validated.params.name);
  sendSuccess(res, null, 'Đã xoá thư mục');
}

/** **[BÀI 13]** `DELETE /admin/media/:id`. Message `'Đã xoá ảnh'`. */
async function remove(req, res) {
  return notImplemented('bai-13');
}

/**
 * **[BÀI 13]** `POST /admin/media/cleanup-orphans`. Lấy `deletedCount` từ service rồi
 * `sendSuccess` với data `{ deletedCount }` và message dạng "Đã dọn N ảnh mồ côi".
 */
async function cleanupOrphans(_req, res) {
  return notImplemented('bai-13');
}

export const mediaController = {
  redirectToContent,
  requestUpload,
  requestAvatarUpload,
  completeUpload,
  list,
  listFolders,
  createFolder,
  deleteFolder,
  remove,
  cleanupOrphans,
};
