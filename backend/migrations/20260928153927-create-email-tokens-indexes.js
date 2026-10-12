/**
 * Index cho collection email_tokens (token xác thực email, đặt lại mật khẩu, magic link).
 * Tên index trùng với khai báo trong modules/auth/emailTokens.model.js.
 */

const EMAIL_TOKENS = 'email_tokens';

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function up(db) {
  const emailTokens = db.collection(EMAIL_TOKENS);

  await emailTokens.createIndex({ tokenHash: 1 }, { name: 'tokenHash_unique', unique: true });
  await emailTokens.createIndex({ userId: 1, type: 1 }, { name: 'userId_type' });
  // TTL: MongoDB tự xoá document khi quá expiresAt.
  await emailTokens.createIndex({ expiresAt: 1 }, { name: 'expiresAt_ttl', expireAfterSeconds: 0 });
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function down(db) {
  const emailTokens = db.collection(EMAIL_TOKENS);

  await emailTokens.dropIndex('expiresAt_ttl');
  await emailTokens.dropIndex('userId_type');
  await emailTokens.dropIndex('tokenHash_unique');
}
