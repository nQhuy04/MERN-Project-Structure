/**
 * Index cho collection users. Tên index phải trùng với khai báo trong users.model.js
 * (test diffIndexes kiểm tra hai nơi khớp nhau).
 *
 * Lưu ý khi chạy trên DB đã có dữ liệu: index unique sẽ tạo thất bại nếu đang có email trùng
 * hoặc nhiều hơn 1 SUPER_ADMIN — phải làm sạch dữ liệu trước.
 */

const USERS = 'users';

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi đã tạo xong index
 */
export async function up(db) {
  const users = db.collection(USERS);

  await users.createIndex({ email: 1 }, { name: 'email_unique', unique: true });
  await users.createIndex(
    { googleId: 1 },
    {
      name: 'googleId_unique',
      unique: true,
      partialFilterExpression: { googleId: { $type: 'string' } },
    },
  );
  await users.createIndex(
    { role: 1 },
    {
      name: 'role_single_super_admin',
      unique: true,
      partialFilterExpression: { role: 'SUPER_ADMIN' },
    },
  );
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi đã xoá index
 */
export async function down(db) {
  const users = db.collection(USERS);

  await users.dropIndex('role_single_super_admin');
  await users.dropIndex('googleId_unique');
  await users.dropIndex('email_unique');
}
