// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 13.
import { http } from '@/shared/lib/http';
import { notImplemented } from '@/shared/lib/practice';

/** Query key factory của feature media (thư viện ảnh quản trị). */
export const mediaKeys = {
  all: ['media'],
  list: (params) => [...mediaKeys.all, 'list', params],
  folders: () => [...mediaKeys.all, 'folders'],
};

/** @param {Object} params bộ lọc — giá trị rỗng không gửi @returns {Promise} resolve `{ items, meta }` */
export async function listMedia(params) {
  return notImplemented('bai-13');
}

/**
 * @returns {Promise} resolve mảng thư mục `{ name, isSystem, mediaCount, totalSize, coverIds,
 *   lastUploadedAt, createdAt }`
 */
export async function listMediaFolders() {
  return notImplemented('bai-13');
}

/**
 * @param {string} name tên thư mục `[a-z0-9-]`
 * @returns {Promise} resolve body response (`data` = thư mục vừa tạo)
 * @throws {ApiError} FOLDER_EXISTS (409)
 */
export async function createMediaFolder(name) {
  return notImplemented('bai-13');
}

/**
 * @param {string} name
 * @returns {Promise} resolve body response
 * @throws {ApiError} FOLDER_NOT_EMPTY (409)
 */
export async function deleteMediaFolder(name) {
  return notImplemented('bai-13');
}

/**
 * @param {Object} body `{ folder, fileName, contentType, size }`
 * @returns {Promise} resolve `{ media, upload }`
 */
export async function presignMedia(body) {
  return notImplemented('bai-13');
}

/** @param {string} mediaId @returns {Promise} resolve media READY */
export async function completeMedia(mediaId) {
  return notImplemented('bai-13');
}

/**
 * @param {string} mediaId
 * @returns {Promise} resolve body response
 * @throws {ApiError} MEDIA_IN_USE (details = nơi dùng `{ label, href }`)
 */
export async function deleteMedia(mediaId) {
  return notImplemented('bai-13');
}

/** @returns {Promise} resolve body response (`data.deletedCount`) */
export async function cleanupOrphanMedia() {
  return notImplemented('bai-13');
}
