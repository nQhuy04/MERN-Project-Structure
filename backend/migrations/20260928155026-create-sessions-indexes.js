/**
 * Index cho collection sessions (phiên đăng nhập / refresh token).
 * Tên index trùng với khai báo trong modules/sessions/sessions.model.js.
 */

const SESSIONS = 'sessions';

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function up(db) {
  const sessions = db.collection(SESSIONS);

  await sessions.createIndex({ userId: 1 }, { name: 'userId' });
  // TTL: phiên quá hạn (không refresh trong 30 ngày) tự bị xoá.
  await sessions.createIndex({ expiresAt: 1 }, { name: 'expiresAt_ttl', expireAfterSeconds: 0 });
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function down(db) {
  const sessions = db.collection(SESSIONS);

  await sessions.dropIndex('expiresAt_ttl');
  await sessions.dropIndex('userId');
}
