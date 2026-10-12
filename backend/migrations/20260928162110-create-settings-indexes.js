/**
 * Index cho collection settings. Tên index trùng với modules/settings/settings.model.js.
 * Không seed giá trị: setting chưa lưu dùng giá trị mặc định khai báo trong registry.
 */

const SETTINGS = 'settings';

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function up(db) {
  await db.collection(SETTINGS).createIndex({ key: 1 }, { name: 'key_unique', unique: true });
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function down(db) {
  await db.collection(SETTINGS).dropIndex('key_unique');
}
