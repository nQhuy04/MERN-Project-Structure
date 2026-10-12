/**
 * Template cho `npm run db:migrate:create -- <tên>` (migrate-mongo không chạy file này).
 * Mỗi migration phải có `down` đảo ngược được `up`.
 */

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function up(db) {
  // Ví dụ: await db.collection('users').createIndex({ email: 1 }, { unique: true, name: 'email_unique' });
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function down(db) {
  // Ví dụ: await db.collection('users').dropIndex('email_unique');
}
