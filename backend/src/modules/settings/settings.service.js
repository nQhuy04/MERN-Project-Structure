// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 09.
import mongoose from 'mongoose';
import { db } from '../../shared/config/db.js';
import { features } from '../../shared/config/features.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { logger } from '../../shared/lib/logger.js';
import { usersService } from '../users/users.service.js';
import { SETTING_DEFINITIONS } from './settings.registry.js';
import { Setting } from './settings.model.js';

/**
 * Giá trị hiệu lực của một setting: giá trị trong DB nếu đúng kiểu, ngược lại là default.
 * @param {string} key
 * @param {*} storedValue giá trị trong DB (undefined nếu chưa lưu)
 * @returns {*}
 */
function resolveValue(key, storedValue) {
  const definition = SETTING_DEFINITIONS[key];
  if (storedValue === undefined) return definition.default;

  const result = definition.schema.safeParse(storedValue);
  if (!result.success) {
    logger.warn({ key }, 'Giá trị setting trong DB sai kiểu — dùng giá trị mặc định');
    return definition.default;
  }
  return result.data;
}

/**
 * @param {string[]} keys
 * @returns {Promise} resolve Map key → document setting (lean)
 */
async function findStored(keys) {
  const documents = await Setting.find({ key: mongoose.trusted({ $in: keys }) }).lean();
  return new Map(documents.map((document) => [document.key, document]));
}

/**
 * Đọc giá trị hiệu lực của một setting.
 * @param {string} key một key trong SETTING_KEYS
 * @returns {Promise} resolve giá trị
 * @throws {Error} key không khai báo trong registry (lỗi lập trình)
 */
async function get(key) {
  if (!SETTING_DEFINITIONS[key]) throw new Error(`Setting "${key}" chưa khai báo trong registry`);
  const stored = await Setting.findOne({ key }).lean();
  return resolveValue(key, stored?.value);
}

/**
 * Cấu hình công khai cho frontend (không cần đăng nhập): setting `isPublic` + cờ tính năng
 * theo biến môi trường.
 * @returns {Promise} resolve `{ settings: { key: value }, features: { googleOAuth, storage } }`
 */
async function getPublic() {
  const publicKeys = Object.keys(SETTING_DEFINITIONS).filter(
    (key) => SETTING_DEFINITIONS[key].isPublic,
  );
  const stored = await findStored(publicKeys);

  return {
    settings: Object.fromEntries(
      publicKeys.map((key) => [key, resolveValue(key, stored.get(key)?.value)]),
    ),
    features: features.getFlags(),
  };
}

/**
 * **[BÀI 09]** Toàn bộ setting kèm mô tả cho trang quản trị.
 *
 * Các bước:
 * 1. `keys` = mọi key trong `SETTING_DEFINITIONS` (registry — nguồn sự thật, không hard-code).
 * 2. `findStored(keys)` → Map key → document.
 * 3. Gom `updatedBy` của các document (bỏ giá trị rỗng) rồi `usersService.findNamesByIds(...)`
 *    — **một** truy vấn cho tất cả, không gọi trong vòng lặp (tránh N+1).
 * 4. `keys.map(...)`: mỗi mục gồm `key`, `value` (qua `resolveValue`), `default`, `isPublic`,
 *    `input`, `label`, `description` từ registry, `options` (`definition.options ? definition.options()
 *    : null` — chỉ setting kiểu `select` có, xem bài 15), `updatedAt`, và `updatedBy` dạng
 *    `{ id, name }` hoặc `null`.
 *
 * Duyệt theo **`keys` của registry** chứ không theo document trong DB: setting chưa ai sửa thì
 * chưa có document, nhưng vẫn phải hiện ra với giá trị mặc định.
 *
 * @returns {Promise} resolve mảng `{ key, value, default, isPublic, input, options, label, description, updatedAt, updatedBy }`
 * @throws {AppError} 501 khi chưa làm
 */
async function listForAdmin() {
  return notImplemented('bai-09');
}

/**
 * **[BÀI 09]** Super Admin cập nhật nhiều setting cùng lúc.
 *
 * Các bước: `await db.runInTransaction(async (session) => {...})`, bên trong duyệt
 * `Object.entries(values)` và với mỗi cặp gọi `Setting.findOneAndUpdate({ key },
 * { $set: { value, updatedBy: actorId } }, { upsert: true, runValidators: true, session })`.
 * Sau transaction, trả `listForAdmin()`.
 *
 * ⚠️ **`upsert: true`** là bắt buộc: setting chưa ai sửa thì chưa có document trong DB (giá trị
 * đang là default của registry), nên phải tạo mới chứ không chỉ cập nhật.
 *
 * ⚠️ **Transaction**: hoặc tất cả được lưu, hoặc không cái nào. Lưu nửa chừng sẽ để hệ thống ở
 * trạng thái mà Super Admin không hề chọn — ví dụ vừa tắt đăng ký vừa tắt magic link, nhưng chỉ
 * một cái được ghi.
 *
 * Trả về danh sách mới (thay vì chỉ `message`) để frontend cập nhật cache ngay, không phải gọi
 * lại API.
 *
 * @param {Object} values `{ key: value }` đã validate theo registry
 * @param {string} actorId người sửa
 * @returns {Promise} resolve danh sách setting sau khi cập nhật (như listForAdmin)
 * @throws {AppError} 501 khi chưa làm
 */
async function update(values, actorId) {
  return notImplemented('bai-09');
}

export const settingsService = { get, getPublic, listForAdmin, update };
