/**
 * Index cho trang quản lý người dùng: sắp xếp theo ngày tạo (mặc định) và lọc theo role.
 * Tên index trùng với modules/users/users.model.js.
 */

const USERS = 'users';

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function up(db) {
  const users = db.collection(USERS);

  await users.createIndex({ createdAt: -1 }, { name: 'createdAt_desc' });
  await users.createIndex({ role: 1, createdAt: -1 }, { name: 'role_createdAt' });
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function down(db) {
  const users = db.collection(USERS);

  await users.dropIndex('role_createdAt');
  await users.dropIndex('createdAt_desc');
}
