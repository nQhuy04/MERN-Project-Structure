// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 05, 07.
import { http } from '@/shared/lib/http';
import { notImplemented } from '@/shared/lib/practice';

/**
 * **[BÀI 05]** Gọi `PATCH /users/me`. Cùng khuôn với các hàm API ở bài 02–04, nhưng dùng
 * `http.patch`.
 * @param {Object} body `{ name }`
 * @returns {Promise} resolve `{ message, data: user }`
 */
export async function updateMe(body) {
  return notImplemented('bai-05');
}

/**
 * **[BÀI 07]** Ba hàm trên gọi `GET /sessions`, `DELETE /sessions/:id`, `DELETE /sessions`.
 * `getSessions` trả thẳng mảng (`response.data.data`) vì nơi gọi chỉ cần danh sách; hai hàm xoá
 * trả cả body (`response.data`) vì nơi gọi cần `message` và `data.revokedCount`.
 */

/** Query key factory cho dữ liệu tài khoản. */
export const accountKeys = {
  all: ['account'],
  sessions: () => [...accountKeys.all, 'sessions'],
};

/**
 * @returns {Promise} resolve mảng phiên `{ id, device, ip, lastUsedAt, createdAt, isCurrent }`
 */
export async function getSessions() {
  return notImplemented('bai-07');
}

/**
 * @param {string} sessionId
 * @returns {Promise} resolve body response
 */
export async function revokeSession(sessionId) {
  return notImplemented('bai-07');
}

/** @returns {Promise} resolve body response (`data.revokedCount`) */
export async function revokeOtherSessions() {
  return notImplemented('bai-07');
}

/**
 * Xin URL tải ảnh đại diện (≤ 2MB, luôn vào folder avatars).
 * @param {Object} body `{ fileName, contentType, size }`
 * @returns {Promise} resolve `{ media, upload }`
 */
export async function presignAvatar(body) {
  return notImplemented('bai-13');
}

/** @param {string} mediaId @returns {Promise} resolve media READY */
export async function completeAvatarUpload(mediaId) {
  return notImplemented('bai-13');
}

/**
 * @param {string|null} mediaId null = gỡ ảnh
 * @returns {Promise} resolve body response (`data` = user)
 */
export async function updateAvatar(mediaId) {
  return notImplemented('bai-13');
}
