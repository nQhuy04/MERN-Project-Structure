import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, inject } from 'vitest';

// Mỗi file test dùng một database riêng → các file chạy song song không ảnh hưởng nhau.
const mongoUri = new URL(inject('mongoUri'));
mongoUri.pathname = `/test-${randomUUID()}`;
process.env.MONGODB_URI = mongoUri.toString();

// Import động SAU khi đặt biến môi trường: env.js đọc process.env ngay lúc được nạp.
const { db } = await import('../src/shared/config/db.js');
const { default: mongoose } = await import('mongoose');
const { migrateUp } = await import('./helpers/migrations.js');

beforeAll(async () => {
  await db.connectDB();
  // Index do migration tạo (autoIndex tắt ngoài development) → test chạy trên đúng
  // cấu trúc index như production.
  await migrateUp();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await db.disconnectDB();
});
