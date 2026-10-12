// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 12.
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { storage } from '../../shared/lib/storage.js';
import { mapLeanDocument } from '../../shared/utils/mongo.js';
import { buildPaginationMeta, getSkip } from '../../shared/utils/pagination.js';
import {
  FILE_STATUSES,
  MAX_FILES_PER_USER,
  MAX_TOTAL_SIZE_BYTES_PER_USER,
} from './files.constants.js';
import { File } from './files.model.js';

function fileNotFoundError() {
  return new AppError({
    statusCode: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: 'Không tìm thấy file',
  });
}

/**
 * **[BÀI 12]** Dung lượng và số file một user đang chiếm.
 *
 * Các bước: `File.aggregate` với `$match` theo `ownerId` — ép về
 * `new mongoose.Types.ObjectId(String(ownerId))` vì aggregate **không** tự ép kiểu như `find` —
 * rồi `$group` với `_id: null`, `totalSize: { $sum: '$size' }`, `count: { $sum: 1 }`. Không có
 * bản ghi nào thì aggregate trả mảng rỗng, nên trả `{ totalSize: 0, count: 0 }`.
 *
 * ⚠️ Đếm **cả** bản ghi PENDING, không lọc `status` — xem `assertWithinQuota`.
 *
 * @param {string} ownerId
 * @returns {Promise} resolve `{ totalSize, count }`
 * @throws {AppError} 501 khi chưa làm
 */
async function getUsage(ownerId) {
  return notImplemented('bai-12');
}

/**
 * **[BÀI 12]** Chặn một tài khoản chiếm hết dung lượng bucket.
 *
 * Các bước: `getUsage(ownerId)` → `count >= MAX_FILES_PER_USER` thì ném 403
 * `STORAGE_QUOTA_EXCEEDED` (thông điệp nói rõ giới hạn số file) → `totalSize + size >
 * MAX_TOTAL_SIZE_BYTES_PER_USER` thì ném 403 `STORAGE_QUOTA_EXCEEDED` (thông điệp về dung lượng).
 *
 * ⚠️ Quota tính cả bản ghi **PENDING**: nếu chỉ tính READY, chỉ cần xin URL liên tục rồi bỏ ngang
 * là lách được — mỗi lần xin URL đã tạo một bản ghi và có thể đã đẩy object lên R2.
 *
 * @param {string} ownerId
 * @param {number} size dung lượng file sắp tải lên
 * @returns {Promise} resolve khi còn quota
 * @throws {AppError} 403 STORAGE_QUOTA_EXCEEDED
 */
async function assertWithinQuota(ownerId, size) {
  return notImplemented('bai-12');
}

/**
 * **[BÀI 12]** Bước 1 — xin URL upload.
 *
 * Các bước:
 * 1. `await assertWithinQuota(ownerId, size)`.
 * 2. `File.create({ ownerId, key, originalName: fileName, contentType, size })` với `key` dạng
 *    `users/<ownerId>/<randomUUID()>` — **server sinh key**, không nhận từ client.
 * 3. `storage.createUploadUrl({ key: file.key, contentType, contentLength: size })`.
 * 4. Trả `{ file, upload }`.
 *
 * ⚠️ **Key do server sinh**, chứa `ownerId` và một UUID. Nhận key từ client thì người ta ghi đè
 * được file của người khác, hoặc thoát khỏi "thư mục" của mình bằng `../`.
 *
 * ⚠️ URL được ký **kèm** `contentType` và `contentLength`: R2 tự từ chối nếu client PUT nội dung
 * khác loại hoặc khác kích thước đã khai báo — một lớp chặn nằm ở phía kho lưu trữ.
 *
 * @param {string} ownerId
 * @param {Object} input `{ fileName, contentType, size }` đã validate (whitelist loại, ≤ 10MB)
 * @returns {Promise} resolve `{ file, upload: { url, method, headers } }`
 * @throws {AppError} 403 STORAGE_QUOTA_EXCEEDED
 */
async function requestUpload(ownerId, { fileName, contentType, size }) {
  return notImplemented('bai-12');
}

/**
 * **[BÀI 12]** Bước 3 — client báo đã PUT xong. **Không tin lời client.**
 *
 * Các bước:
 * 1. `File.findOne({ _id: fileId, ownerId, status: FILE_STATUSES.PENDING })`; không có → ném
 *    `fileNotFoundError()`. `ownerId` trong filter là lớp chống IDOR (bài 07).
 * 2. `storage.headObject(file.key)`; không có object → 400 `UPLOAD_NOT_FOUND` (`'Chưa nhận được
 *    file trên kho lưu trữ, vui lòng tải lên lại'`).
 * 3. `uploaded.size` hoặc `uploaded.contentType` **lệch** với lúc khai báo → xoá object trên R2,
 *    xoá bản ghi, rồi ném 400 `UPLOAD_MISMATCH`.
 * 4. Chuyển `status` sang READY bằng `findOneAndUpdate` có điều kiện `status: PENDING`; không
 *    khớp → `fileNotFoundError()`.
 *
 * ⚠️ Bước 2–3 chính là lý do tồn tại của bước "complete". Client có thể gọi API này mà **không**
 * hề PUT gì; tin lời nó thì database đầy bản ghi READY trỏ vào object không tồn tại.
 *
 * @param {string} ownerId
 * @param {string} fileId
 * @returns {Promise} resolve file đã READY
 * @throws {AppError} 404 | 400 UPLOAD_NOT_FOUND | 400 UPLOAD_MISMATCH
 */
async function completeUpload(ownerId, fileId) {
  return notImplemented('bai-12');
}

/**
 * **[BÀI 12]** File đã tải lên xong của **chính mình**, mới nhất trước.
 *
 * Các bước: `filter = { ownerId, status: FILE_STATUSES.READY }`; `Promise.all` giữa
 * `File.find(filter).select('originalName contentType size createdAt').sort({ createdAt: -1 })
 * .skip(getSkip({ page, limit })).limit(limit).lean()` và `File.countDocuments(filter)`; trả
 * `{ items: mapLeanDocument(files), meta: buildPaginationMeta({ page, limit, total }) }`.
 *
 * Lọc `status: READY` để bản ghi PENDING (upload dở) không hiện ra — chúng do job bài 14 dọn.
 *
 * @param {string} ownerId
 * @param {Object} query `{ page, limit }`
 * @returns {Promise} resolve `{ items, meta }`
 * @throws {AppError} 501 khi chưa làm
 */
async function listForOwner(ownerId, { page, limit }) {
  return notImplemented('bai-12');
}

/**
 * **[BÀI 12]** Link tải (presigned GET, hết hạn 5 phút).
 *
 * Các bước: `File.findOne({ _id: fileId, ownerId, status: READY })`; không có →
 * `fileNotFoundError()`. Rồi `storage.createDownloadUrl({ key: file.key, downloadName:
 * file.originalName })` và trả `{ url }`.
 *
 * Bucket R2 là **private**, không có URL công khai nào. Mỗi lần tải, server ký một URL sống ngắn
 * — link bị chia sẻ lại cũng chết sau 5 phút.
 *
 * @param {string} ownerId
 * @param {string} fileId
 * @returns {Promise} resolve `{ url }`
 * @throws {AppError} 404 khi không phải file của mình
 */
async function getDownloadUrl(ownerId, fileId) {
  return notImplemented('bai-12');
}

/**
 * **[BÀI 12]** Xoá file của chính mình.
 *
 * Các bước: `File.findOne({ _id: fileId, ownerId })`; không có → `fileNotFoundError()`. Rồi
 * `storage.deleteObject(file.key)` **trước**, `File.deleteOne(...)` **sau**.
 *
 * ⚠️ **Thứ tự quan trọng.** Xoá bản ghi trước mà R2 lỗi thì object nằm lại trên bucket vĩnh viễn,
 * không ai biết nó tồn tại để dọn (và vẫn tính tiền). Xoá object trước: R2 lỗi thì bản ghi còn
 * nguyên, người dùng bấm xoá lại được. Có test: _"R2 lỗi khi xoá → 500, bản ghi còn nguyên"_.
 *
 * @param {string} ownerId
 * @param {string} fileId
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 404 khi không phải file của mình
 */
async function remove(ownerId, fileId) {
  return notImplemented('bai-12');
}

/**
 * Dọn upload dở: bản ghi PENDING quá hạn (người dùng xin URL rồi bỏ ngang) — xoá object (nếu
 * đã lỡ lên R2) và bản ghi. Dùng cho job định kỳ.
 * @param {Object} params `{ olderThanMs, now }`
 * @returns {Promise} resolve số bản ghi đã dọn
 */
async function cleanupPendingUploads({ olderThanMs, now = new Date() }) {
  const pending = await File.find({
    status: FILE_STATUSES.PENDING,
    createdAt: mongoose.trusted({ $lt: new Date(now.getTime() - olderThanMs) }),
  }).select('key');

  for (const file of pending) {
    await storage.deleteObject(file.key);
    await File.deleteOne({ _id: file._id });
  }
  return pending.length;
}

export const filesService = {
  requestUpload,
  completeUpload,
  listForOwner,
  getDownloadUrl,
  remove,
  cleanupPendingUploads,
};
