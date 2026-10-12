/**
 * Index cho collection media (ảnh hệ thống). Tên trùng modules/media/media.model.js.
 */

const MEDIA = 'media';

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function up(db) {
  const media = db.collection(MEDIA);

  await media.createIndex({ key: 1 }, { name: 'key_unique', unique: true });
  await media.createIndex({ folder: 1, createdAt: -1 }, { name: 'folder_createdAt' });
  await media.createIndex({ status: 1, createdAt: 1 }, { name: 'status_createdAt' });
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function down(db) {
  const media = db.collection(MEDIA);

  await media.dropIndex('status_createdAt');
  await media.dropIndex('folder_createdAt');
  await media.dropIndex('key_unique');
}
