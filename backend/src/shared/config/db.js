import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

// Cấu hình toàn cục phải chạy TRƯỚC khi định nghĩa bất kỳ schema/model nào.
// Vì vậy server.js, tests/setup.js và scripts/* luôn import file này trước app/model.

// Chống NoSQL operator injection: object có key `$...` trong filter bị bọc thành `$eq`.
// Operator do server tự dựng phải bọc `mongoose.trusted()` một cách có chủ đích.
mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);
// Index production được tạo bằng migration (migrate-mongo), autoIndex chỉ cho dev.
mongoose.set('autoIndex', env.IS_DEVELOPMENT);
// API luôn trả `id` (string), không `_id`/`__v`. Kết quả `.lean()` không đi qua
// toJSON → phải chuẩn hoá bằng hàm map chung (shared/utils/mongo.js).
// Trường khai báo `select: false` (vd. passwordHash) cũng bị bỏ khỏi JSON: document vừa
// `create()` vẫn giữ giá trị này trong bộ nhớ, `select: false` chỉ có tác dụng khi query.
mongoose.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    for (const [path, schemaType] of Object.entries(doc.schema.paths)) {
      if (schemaType.options.select === false) delete ret[path];
    }
    return ret;
  },
});

const SERVER_SELECTION_TIMEOUT_MS = 5000;

/**
 * Kết nối MongoDB. Gọi một lần trước khi server listen.
 * @param {string} [uri] mặc định lấy từ env (test truyền URI của DB in-memory)
 * @returns {Promise} resolve khi đã kết nối
 * @throws {Error} khi không kết nối được (fail fast, không để request treo)
 */
async function connectDB(uri = env.MONGODB_URI) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS });
  logger.info({ db: mongoose.connection.name }, 'Đã kết nối MongoDB');
}

/**
 * Ngắt kết nối MongoDB (graceful shutdown, kết thúc test/script).
 * @returns {Promise} resolve khi đã ngắt kết nối
 */
async function disconnectDB() {
  await mongoose.disconnect();
  logger.info('Đã ngắt kết nối MongoDB');
}

/**
 * Kiểm tra DB còn phản hồi (dùng cho health check).
 * @returns {Promise} resolve `true` nếu DB phản hồi, `false` nếu không
 */
async function pingDB() {
  if (mongoose.connection.readyState !== mongoose.ConnectionStates.connected) return false;

  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Chạy nhiều thao tác ghi trong một transaction: tất cả thành công hoặc không thao tác nào có
 * hiệu lực. Mọi truy vấn bên trong PHẢI truyền `{ session }` — quên truyền thì thao tác đó
 * nằm ngoài transaction. Mongoose tự thử lại khi gặp lỗi tạm thời (TransientTransactionError).
 * Cần MongoDB replica set (Atlas có sẵn; test dùng MongoMemoryReplSet).
 * @param {Function} work `async (session) => kết quả`
 * @returns {Promise} resolve kết quả của `work`
 */
async function runInTransaction(work) {
  return mongoose.connection.transaction(work);
}

export const db = { connectDB, disconnectDB, pingDB, runInTransaction };
