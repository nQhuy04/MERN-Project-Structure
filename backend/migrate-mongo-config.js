import { env } from './src/shared/config/env.js';

/**
 * Cấu hình migrate-mongo. Dùng chung env đã validate với app để migration luôn
 * chạy trên đúng database mà app đang dùng (tên DB nằm trong MONGODB_URI).
 */
const config = {
  mongodb: {
    url: env.MONGODB_URI,
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  lockCollectionName: 'changelog_lock',
  // Khoá tự hết hạn sau 5 phút nếu tiến trình migration chết giữa chừng.
  lockTtl: 300,
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'esm',
};

export default config;
