/**
 * Collection media_folders (thư mục của thư viện ảnh). Tên index trùng
 * modules/media/mediaFolder.model.js.
 *
 * Tạo bù thư mục cho ảnh đã có (trước đây thư mục chỉ tồn tại qua `media.folder`), trừ thư mục
 * hệ thống. `down` chỉ gỡ index — bản ghi thư mục giữ lại vô hại.
 */

const MEDIA = 'media';
const MEDIA_FOLDERS = 'media_folders';
// Chép từ media.constants.js SYSTEM_FOLDERS: migration không import code ứng dụng (code đổi về
// sau thì migration cũ vẫn phải chạy đúng như lúc viết).
const SYSTEM_FOLDERS = ['avatars'];

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function up(db) {
  const folders = db.collection(MEDIA_FOLDERS);
  await folders.createIndex({ name: 1 }, { name: 'name_unique', unique: true });

  const existingNames = await db.collection(MEDIA).distinct('folder');
  const now = new Date();
  for (const name of existingNames.filter((folder) => !SYSTEM_FOLDERS.includes(folder))) {
    await folders.updateOne(
      { name },
      { $setOnInsert: { name, createdBy: null, createdAt: now, updatedAt: now } },
      { upsert: true },
    );
  }
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function down(db) {
  await db.collection(MEDIA_FOLDERS).dropIndex('name_unique');
}
