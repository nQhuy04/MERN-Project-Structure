import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config, down, up } from 'migrate-mongo';
import migrateConfig from '../../migrate-mongo-config.js';

// Dùng đúng cấu hình của `npm run db:migrate`, chỉ đổi thư mục sang đường dẫn tuyệt đối
// để không phụ thuộc thư mục đang đứng khi chạy test.
config.set({
  ...migrateConfig,
  migrationsDir: fileURLToPath(new URL('../../migrations', import.meta.url)),
});

/**
 * Chạy mọi migration chưa áp dụng trên kết nối Mongoose hiện tại (DB test in-memory).
 * @returns {Promise} resolve danh sách file đã chạy
 */
export function migrateUp() {
  return up(mongoose.connection.db, mongoose.connection.getClient());
}

/**
 * Hoàn tác migration gần nhất.
 * @returns {Promise} resolve danh sách file đã hoàn tác
 */
export function migrateDown() {
  return down(mongoose.connection.db, mongoose.connection.getClient());
}
