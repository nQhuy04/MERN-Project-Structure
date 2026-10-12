// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 14.
import mongoose from 'mongoose';
import { db } from '../../shared/config/db.js';
import { env } from '../../shared/config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { mapLeanDocument } from '../../shared/utils/mongo.js';
import { buildPaginationMeta, getSkip } from '../../shared/utils/pagination.js';
import { JOB_RUN_STATUSES, Job, JobRun } from './jobs.model.js';
import { JOB_DEFINITIONS, JOB_TYPES, parseJobConfig } from './jobs.registry.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { jobsRunner, lockAvailableFilter } from './jobs.runner.js';
import { SCHEDULE_KINDS, computeFirstRun } from './jobs.schedule.js';

/**
 * Job hệ thống (seed): định danh ổn định `systemKey`, không xoá được, chỉ tạm dừng.
 * Lịch mặc định: dọn dẹp mỗi ngày lúc rạng sáng theo JOBS_TIMEZONE.
 */
const SYSTEM_JOBS = [
  {
    systemKey: 'cleanup-orphan-media',
    name: 'Dọn ảnh mồ côi',
    type: JOB_TYPES.CLEANUP_ORPHAN_MEDIA,
    schedule: { kind: SCHEDULE_KINDS.INTERVAL, everyDays: 1, time: '03:00' },
  },
  {
    systemKey: 'cleanup-pending-uploads',
    name: 'Dọn upload dở',
    type: JOB_TYPES.CLEANUP_PENDING_UPLOADS,
    schedule: { kind: SCHEDULE_KINDS.INTERVAL, everyDays: 1, time: '03:30' },
  },
  {
    systemKey: 'cleanup-unverified-users',
    name: 'Dọn tài khoản chưa kích hoạt',
    type: JOB_TYPES.CLEANUP_UNVERIFIED_USERS,
    schedule: { kind: SCHEDULE_KINDS.INTERVAL, everyDays: 1, time: '04:00' },
  },
];

function jobNotFoundError() {
  return new AppError({
    statusCode: 404,
    code: ERROR_CODES.RESOURCE_NOT_FOUND,
    message: 'Không tìm thấy job',
  });
}

function jobRunningError() {
  return new AppError({
    statusCode: 409,
    code: ERROR_CODES.JOB_RUNNING,
    message: 'Job đang chạy, vui lòng thử lại sau',
  });
}

/**
 * @param {Object} schedule đã validate
 * @param {Date} now
 * @throws {AppError} 400 khi lịch ONCE ở quá khứ
 */
function assertScheduleInFuture(schedule, now) {
  if (schedule.kind === SCHEDULE_KINDS.ONCE && schedule.runAt.getTime() <= now.getTime()) {
    throw new AppError({
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Dữ liệu không hợp lệ',
      details: [{ field: 'schedule.runAt', message: 'Thời điểm chạy phải ở tương lai' }],
    });
  }
}

/**
 * Tạo các job hệ thống còn thiếu (idempotent, gọi từ seed). Job đã có giữ nguyên cấu hình
 * quản trị viên đã sửa.
 * @param {Object} [options] `{ now }`
 * @returns {Promise} resolve số job vừa tạo
 */
async function ensureSystemJobs({ now = new Date() } = {}) {
  let createdCount = 0;
  for (const systemJob of SYSTEM_JOBS) {
    if (await Job.exists({ systemKey: systemJob.systemKey })) continue;
    await Job.create({
      ...systemJob,
      config: parseJobConfig(systemJob.type, {}),
      nextRunAt: computeFirstRun(systemJob.schedule, now, env.JOBS_TIMEZONE),
    });
    createdCount += 1;
  }
  return createdCount;
}

/**
 * Mô tả các loại job cho giao diện (form sinh từ `configFields`).
 * @returns {Object[]}
 */
function listTypes() {
  return Object.entries(JOB_DEFINITIONS).map(([type, definition]) => ({
    type,
    label: definition.label,
    description: definition.description,
    isSystemOnly: definition.isSystemOnly,
    configFields: definition.configFields,
  }));
}

/** @returns {Promise} resolve mọi job (job hệ thống trước), kèm `isSystem`, `isRunning` */
/**
 * **[BÀI 14]** Mọi job, job hệ thống lên đầu.
 *
 * Các bước: `Job.find().sort({ systemKey: -1, createdAt: -1 }).lean()`, rồi `mapLeanDocument` và
 * `.map()` — **loại bỏ** `systemKey` và `lockedAt` khỏi kết quả, thay bằng hai cờ
 * `isSystem: Boolean(systemKey)` và `isRunning: Boolean(lockedAt)` (destructuring với rest làm
 * việc này gọn nhất).
 *
 * Không trả `lockedAt` ra ngoài: frontend chỉ cần biết "đang chạy hay không", không cần biết
 * thời điểm khoá.
 *
 * @returns {Promise} resolve mọi job (job hệ thống trước), kèm `isSystem`, `isRunning`
 * @throws {AppError} 501 khi chưa làm
 */
async function list() {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Tạo job mới.
 *
 * Các bước: `assertScheduleInFuture(schedule, now)` (đã viết sẵn) → `Job.create({ name, type,
 * config: parseJobConfig(type, config), schedule, nextRunAt: computeFirstRun(schedule, now,
 * env.JOBS_TIMEZONE), createdBy: actorId })`.
 *
 * `parseJobConfig` (trong `jobs.registry.js`) validate `config` theo **Zod schema của đúng loại
 * job** và thêm tiền tố `config.` vào đường dẫn lỗi — nhờ vậy frontend gắn lỗi vào đúng ô của
 * form được sinh động từ registry.
 *
 * @param {Object} input `{ name, type, config, schedule }` đã validate
 * @param {string} actorId
 * @param {Object} [options] `{ now }`
 * @returns {Promise} resolve job vừa tạo
 * @throws {AppError} 501 khi chưa làm
 */
async function create({ name, type, config, schedule }, actorId, { now = new Date() } = {}) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Sửa tên / config / lịch (**không** đổi loại job).
 *
 * Các bước: `Job.findById`; không có → `jobNotFoundError()`. Dựng `set` **chỉ gồm những trường
 * được gửi lên**: `name`; `config` (qua `parseJobConfig(job.type, ...)` — dùng loại **đã lưu**,
 * không nhận loại mới từ client); `schedule` (kèm `assertScheduleInFuture` và **tính lại**
 * `nextRunAt`). Rồi `Job.findByIdAndUpdate(jobId, { $set: set }, { returnDocument: 'after',
 * runValidators: true })`.
 *
 * ⚠️ Đổi lịch **phải** tính lại `nextRunAt`, nếu không job vẫn chạy theo mốc cũ.
 *
 * @param {string} jobId
 * @param {Object} changes đã validate
 * @param {Object} [options] `{ now }`
 * @returns {Promise} resolve job sau khi sửa
 * @throws {AppError} 501 khi chưa làm
 */
async function update(jobId, changes, { now = new Date() } = {}) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Tạm dừng / tiếp tục — dùng được **cả cho job hệ thống**.
 *
 * Các bước: `Job.findByIdAndUpdate(jobId, { $set: { isPaused } }, { returnDocument: 'after',
 * runValidators: true })`; không có → `jobNotFoundError()`.
 *
 * Job hệ thống không **xoá** được nhưng **tạm dừng** được: quản trị viên cần cách tắt nhanh một
 * job đang gây sự cố mà không phải deploy lại.
 *
 * @param {string} jobId
 * @param {boolean} isPaused
 * @returns {Promise} resolve job sau khi cập nhật
 * @throws {AppError} 501 khi chưa làm
 */
async function setPaused(jobId, isPaused) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Xoá job **và** lịch sử chạy của nó, trong một transaction.
 *
 * Các bước:
 * 1. `Job.findById(jobId).select('systemKey')`; không có → `jobNotFoundError()`.
 * 2. Có `systemKey` → ném 403 `SYSTEM_JOB_PROTECTED` (`'Không thể xoá job hệ thống — chỉ có thể
 *    tạm dừng'`).
 * 3. Trong `db.runInTransaction`: `Job.deleteOne({ _id: jobId, ...lockAvailableFilter(now) },
 *    { session })`; `deletedCount === 0` → ném `jobRunningError()`. Rồi `JobRun.deleteMany({
 *    jobId }, { session })`.
 *
 * ⚠️ **`lockAvailableFilter` trong điều kiện xoá**: nếu job đang chạy, lượt chạy đó sẽ ghi lịch
 * sử cho một job vừa bị xoá — bản ghi mồ côi. Chặn bằng 409 `JOB_RUNNING` và bắt chờ chạy xong.
 *
 * ⚠️ **Transaction**: xoá job mà không xoá lịch sử thì để lại `JobRun` không thuộc về job nào.
 *
 * @param {string} jobId
 * @param {Object} [options] `{ now }`
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 404 | 403 SYSTEM_JOB_PROTECTED | 409 JOB_RUNNING
 */
async function remove(jobId, { now = new Date() } = {}) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Chạy ngay (không đổi lịch).
 *
 * Các bước: `Job.exists({ _id: jobId })` sai → `jobNotFoundError()`. Rồi
 * `jobsRunner.runJobNow(jobId)`; trả `null` (job đang chạy) → `jobRunningError()`. Còn lại trả
 * `run`.
 *
 * Phân biệt hai lỗi rất quan trọng với người dùng: **404** = "job này không tồn tại", **409** =
 * "job đang chạy, chờ chút rồi thử lại".
 *
 * @param {string} jobId
 * @returns {Promise} resolve JobRun
 * @throws {AppError} 404 | 409 JOB_RUNNING
 */
async function runNow(jobId) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Lịch sử chạy của một job, mới nhất trước.
 *
 * Các bước: kiểm job tồn tại (`Job.exists`) → `Promise.all` giữa `JobRun.find({ jobId })
 * .sort({ startedAt: -1 }).skip(getSkip({ page, limit })).limit(limit).lean()` và
 * `JobRun.countDocuments({ jobId })` → trả `{ items: mapLeanDocument(runs), meta }`.
 *
 * `JobRun` có **TTL index 90 ngày** (tạo bằng migration): MongoDB tự xoá lịch sử cũ, không cần
 * job dọn.
 *
 * @param {string} jobId
 * @param {Object} query `{ page, limit }`
 * @returns {Promise} resolve `{ items, meta }`
 * @throws {AppError} 501 khi chưa làm
 */
async function listRuns(jobId, { page, limit }) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Thống kê cho trang tổng quan: số job, số đang bật, 5 lần chạy lỗi gần nhất.
 *
 * Các bước:
 * 1. `Promise.all` ba truy vấn: `Job.countDocuments()`; `Job.countDocuments({ isPaused: false,
 *    nextRunAt: mongoose.trusted({ $ne: null }) })`; `JobRun.find({ status: FAILED })
 *    .sort({ startedAt: -1 }).limit(5).lean()`.
 * 2. Lấy tên job của các lần lỗi bằng **một** truy vấn `Job.find({ _id: { $in: ... } })
 *    .select('name').lean()`, rồi dựng `Map` id → tên (tránh N+1).
 * 3. Trả `{ total, active, recentFailures: [...] }`; job đã bị xoá → `jobName` là `'(đã xoá)'`.
 *
 * "Đang bật" = **không tạm dừng VÀ còn `nextRunAt`**. Job `ONCE` đã chạy xong có `nextRunAt`
 * bằng `null` — nó không tạm dừng, nhưng cũng không còn chạy nữa.
 *
 * @returns {Promise} resolve `{ total, active, recentFailures: [{ jobName, startedAt, error }] }`
 * @throws {AppError} 501 khi chưa làm
 */
async function getStats() {
  return notImplemented('bai-14');
}

export const jobsService = {
  ensureSystemJobs,
  listTypes,
  list,
  create,
  update,
  setPaused,
  remove,
  runNow,
  listRuns,
  getStats,
};
