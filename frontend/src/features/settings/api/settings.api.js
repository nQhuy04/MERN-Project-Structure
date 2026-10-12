// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 09 và bài 15.
import { http } from '@/shared/lib/http';
import { notImplemented } from '@/shared/lib/practice';

/** Query key factory của feature settings. */
export const settingsKeys = {
  all: ['settings'],
  public: () => [...settingsKeys.all, 'public'],
  admin: () => [...settingsKeys.all, 'admin'],
};

/**
 * @returns {Promise} resolve `{ settings: { key: value }, features: { googleOAuth, storage } }`
 */
export async function getPublicSettings() {
  const response = await http.get('/settings/public');
  return response.data.data;
}

/** @returns {Promise} resolve mảng setting kèm mô tả (chỉ Super Admin) */
export async function getAdminSettings() {
  return notImplemented('bai-09');
}

/**
 * @param {Object} values `{ key: value }`
 * @returns {Promise} resolve body response (`data` = danh sách setting mới)
 */
export async function updateSettings(values) {
  return notImplemented('bai-09');
}

/**
 * **[BÀI 15]** Gửi email thử tới Super Admin đang đăng nhập qua một kênh (chờ nhà cung cấp trả lời).
 *
 * TODO(bai-15): `POST /admin/settings/email-test` với body `{ provider }`, trả `response.data`
 * (cả body — hook cần `message` để hiện toast), giống `updateSettings`.
 *
 * @param {string} provider 'console' | 'resend' | 'smtp'
 * @returns {Promise} resolve body response (`message`, `data: { to, provider }`)
 */
export async function sendTestEmail(provider) {
  return notImplemented('bai-15');
}
