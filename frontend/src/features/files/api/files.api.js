// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 12.
import { http } from '@/shared/lib/http';
import { notImplemented } from '@/shared/lib/practice';

/** Query key factory của feature files. */
export const filesKeys = {
  all: ['files'],
  list: (page) => [...filesKeys.all, 'list', page],
};

/**
 * **[BÀI 12]** Năm hàm dưới đây gọi `GET /files`, `POST /files/presign`,
 * `POST /files/:id/complete`, `GET /files/:id/download`, `DELETE /files/:id`.
 *
 * Chú ý phần trả về khác nhau: `listFiles` cần cả `meta` (phân trang, như bài 11);
 * `presignFile` / `completeFile` trả `response.data.data`; `getFileDownloadUrl` trả thẳng
 * `response.data.data.url`; `deleteFile` trả cả body vì nơi gọi cần `message`.
 *
 * @param {number} page @returns {Promise} resolve `{ items, meta }`
 */
export async function listFiles(page) {
  return notImplemented('bai-12');
}

/**
 * @param {Object} body `{ fileName, contentType, size }`
 * @returns {Promise} resolve `{ file, upload: { url, method, headers } }`
 */
export async function presignFile(body) {
  return notImplemented('bai-12');
}

/** @param {string} fileId @returns {Promise} resolve file đã READY */
export async function completeFile(fileId) {
  return notImplemented('bai-12');
}

/** @param {string} fileId @returns {Promise} resolve URL tải (hết hạn sau 5 phút) */
export async function getFileDownloadUrl(fileId) {
  return notImplemented('bai-12');
}

/** @param {string} fileId @returns {Promise} resolve body response */
export async function deleteFile(fileId) {
  return notImplemented('bai-12');
}
