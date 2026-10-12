// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 12.
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { sendCreated, sendPaginated, sendSuccess } from '../../shared/utils/response.js';
import { filesService } from './files.service.js';

/**
 * **[BÀI 12]** `POST /files/presign`. Gọi service với `req.auth.userId` và `req.validated.body`,
 * rồi **`sendCreated`** (201) — đang tạo một bản ghi mới, không phải đọc dữ liệu.
 */
async function requestUpload(req, res) {
  return notImplemented('bai-12');
}

/**
 * **[BÀI 12]** `POST /files/:id/complete`. Gọi service với `req.auth.userId` và
 * `req.validated.params.id`, rồi `sendSuccess(res, file, 'Tải lên thành công')`.
 */
async function completeUpload(req, res) {
  return notImplemented('bai-12');
}

/** **[BÀI 12]** `GET /files`. Danh sách có phân trang → dùng `sendPaginated(res, items, meta)`. */
async function list(req, res) {
  return notImplemented('bai-12');
}

/** **[BÀI 12]** `GET /files/:id/download`. Một dòng: `sendSuccess` với kết quả của service. */
async function getDownloadUrl(req, res) {
  return notImplemented('bai-12');
}

/** **[BÀI 12]** `DELETE /files/:id`. `await` service rồi `sendSuccess(res, null, 'Đã xoá file')`. */
async function remove(req, res) {
  return notImplemented('bai-12');
}

export const filesController = { requestUpload, completeUpload, list, getDownloadUrl, remove };
