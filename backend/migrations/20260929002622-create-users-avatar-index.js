/**
 * Index users.avatarMediaId — resolver "nơi dùng" của media tra user theo ảnh đại diện.
 * Partial: chỉ đánh index user đã có avatar. Tên trùng modules/users/users.model.js.
 */

const USERS = 'users';

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function up(db) {
  await db
    .collection(USERS)
    .createIndex(
      { avatarMediaId: 1 },
      { name: 'avatarMediaId', partialFilterExpression: { avatarMediaId: { $type: 'objectId' } } },
    );
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function down(db) {
  await db.collection(USERS).dropIndex('avatarMediaId');
}
