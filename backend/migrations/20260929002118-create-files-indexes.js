/**
 * Index cho collection files (file cá nhân lưu trên R2). Tên trùng modules/files/files.model.js.
 */

const FILES = 'files';

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function up(db) {
  const files = db.collection(FILES);

  await files.createIndex({ key: 1 }, { name: 'key_unique', unique: true });
  await files.createIndex(
    { ownerId: 1, status: 1, createdAt: -1 },
    { name: 'ownerId_status_createdAt' },
  );
  await files.createIndex({ status: 1, createdAt: 1 }, { name: 'status_createdAt' });
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function down(db) {
  const files = db.collection(FILES);

  await files.dropIndex('status_createdAt');
  await files.dropIndex('ownerId_status_createdAt');
  await files.dropIndex('key_unique');
}
