// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 14.
import mongoose from 'mongoose';
import { env } from '../../shared/config/env.js';
import { logger } from '../../shared/lib/logger.js';
import { JOB_RUN_STATUSES, Job, JobRun } from './jobs.model.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { JOB_DEFINITIONS } from './jobs.registry.js';
import { computeNextRunAfter } from './jobs.schedule.js';

/** Khoá giữ quá lâu = tiến trình giữ khoá đã chết → cho phép lấy lại. */
export const STALE_LOCK_MS = 15 * 60 * 1000;
const TICK_INTERVAL_MS = 60 * 1000;
/** Số job tối đa mỗi lần quét — tránh một lần quét chạy mãi nếu có quá nhiều job đến hạn. */
const MAX_JOBS_PER_TICK = 20;

/**
 * Điều kiện "chưa ai giữ khoá, hoặc khoá đã quá hạn".
 * @param {Date} now
 * @returns {Object}
 */
export function lockAvailableFilter(now) {
  return {
    $or: [
      { lockedAt: null },
      { lockedAt: mongoose.trusted({ $lt: new Date(now.getTime() - STALE_LOCK_MS) }) },
    ],
  };
}

/**
 * **[BÀI 14]** Chạy một job **đã giữ khoá**, ghi lịch sử, rồi nhả khoá và dời lịch.
 *
 * Các bước:
 * 1. Nhớ `const lockedAt = job.lockedAt` (dùng ở bước 5).
 * 2. `JobRun.create({ jobId: job._id, startedAt: new Date(), isManual })`.
 * 3. Trong `try`: không có `JOB_DEFINITIONS[job.type]` → ném lỗi "loại job không còn tồn tại";
 *    còn lại `run.result = (await definition.handler(job.config, { now })) ?? null` và
 *    `run.status = SUCCESS`. Trong `catch`: ghi log, `run.status = FAILED`, `run.error =
 *    err.message`.
 * 4. `run.finishedAt = new Date()` rồi `await run.save()`.
 * 5. Dựng `update = { lockedAt: null, lastRunAt: run.startedAt, lastRunStatus: run.status }`;
 *    **chỉ khi không phải chạy tay** mới thêm `update.nextRunAt = computeNextRunAfter(...)`. Rồi
 *    `Job.updateOne({ _id: job._id, lockedAt }, { $set: update }, { runValidators: true })`.
 * 6. Trả `run`.
 *
 * ⚠️ **Handler lỗi KHÔNG được làm hỏng bước nhả khoá.** Vì thế `try/catch` chỉ bọc lời gọi
 * handler; phần ghi lịch sử và nhả khoá nằm ngoài. Thiếu nó, một job lỗi sẽ giữ khoá mãi và
 * không bao giờ chạy lại.
 *
 * ⚠️ **`lockedAt` trong filter ở bước 5**: nếu job chạy quá 15 phút, một tiến trình khác đã coi
 * khoá là chết và lấy lại. Khi đó ta **không** được ghi đè trạng thái của họ — điều kiện này làm
 * lệnh cập nhật không khớp và im lặng bỏ qua.
 *
 * ⚠️ **Chạy tay không dời lịch**: bấm "Chạy ngay" lúc 10:00 không được làm job hẹn 03:00 nhảy
 * sang một mốc khác.
 *
 * @param {Object} job document đã giữ khoá
 * @param {Object} options `{ now, isManual }`
 * @returns {Promise} resolve bản ghi JobRun
 * @throws {AppError} 501 khi chưa làm
 */
async function executeLockedJob(job, { now, isManual = false }) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Nhận (giữ khoá) **một** job đến hạn.
 *
 * Các bước: **một** lệnh `Job.findOneAndUpdate` với filter `{ isPaused: false, nextRunAt:
 * mongoose.trusted({ $lte: now }), ...lockAvailableFilter(now) }`, đặt `{ lockedAt: now }`,
 * options `{ sort: { nextRunAt: 1 }, returnDocument: 'after', runValidators: true }`.
 *
 * ⚠️ Phải là **một** thao tác nguyên tử (cùng nguyên tắc với `consume` bài 03, `rotate` bài 06).
 * Nếu tách "tìm job đến hạn" và "đặt lockedAt" thành hai bước, hai tiến trình (hoặc hai lần gọi
 * `/jobs/trigger` cùng lúc) sẽ cùng nhận một job và chạy nó hai lần. Có test: _"2 lần kích hoạt
 * cùng lúc → mỗi job chỉ chạy 1 lần (khoá nguyên tử)"_.
 *
 * `lockAvailableFilter` (đã viết sẵn ở trên) nhận job **chưa bị khoá** hoặc **khoá đã chết quá
 * 15 phút** — tiến trình cũ có thể đã bị kill giữa chừng.
 *
 * @param {Date} now
 * @returns {Promise} resolve job đã giữ khoá hoặc null
 * @throws {AppError} 501 khi chưa làm
 */
async function claimDueJob(now) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Quét và chạy lần lượt các job đến hạn.
 *
 * TODO(bai-14): vòng `while` tối đa `MAX_JOBS_PER_TICK` lượt — mỗi lượt `claimDueJob(now)`;
 * không còn job nào → `break`; có → `await executeLockedJob(job, { now })` và tăng biến đếm.
 * Trả về số job đã chạy.
 *
 * `MAX_JOBS_PER_TICK` giới hạn số job mỗi lượt quét: tồn đọng lớn thì chia ra nhiều phút, không
 * để một lượt chạy kéo dài vô hạn.
 *
 * **Hàm này trả về 0 khi chưa làm** (thay vì ném lỗi 501): bộ chạy gọi nó **mỗi phút**, ném lỗi
 * ở đây sẽ đổ log lỗi liên tục và che mất mọi thứ khác trong terminal.
 *
 * @param {Object} [options] `{ now }` để test
 * @returns {Promise} resolve số job đã chạy
 */
async function runDueJobs({ now = new Date() } = {}) {
  // TODO(bai-14): thay bằng vòng lặp thật (xem mô tả phía trên).
  return 0;
}

/**
 * **[BÀI 14]** Chạy ngay một job (nút "Chạy ngay").
 *
 * Các bước: `Job.findOneAndUpdate({ _id: jobId, ...lockAvailableFilter(now) }, { $set: { lockedAt:
 * now } }, { returnDocument: 'after', runValidators: true })`; không khớp → trả `null` (job đang
 * chạy hoặc không tồn tại). Có → `executeLockedJob(job, { now, isManual: true })`.
 *
 * Vẫn giữ khoá dù là chạy tay — để không trùng với bộ chạy theo lịch. Và `isManual: true` để
 * **không** dời lịch.
 *
 * @param {string} jobId
 * @param {Object} [options] `{ now }`
 * @returns {Promise} resolve JobRun, hoặc null nếu job đang chạy / không tồn tại
 * @throws {AppError} 501 khi chưa làm
 */
async function runJobNow(jobId, { now = new Date() } = {}) {
  return notImplemented('bai-14');
}

let timer = null;
let currentTick = null;

/** Bộ chạy trong tiến trình: quét mỗi phút (tắt bằng JOBS_RUNNER_ENABLED=false). */
function start() {
  if (timer) return;
  timer = setInterval(() => {
    if (currentTick) return;
    currentTick = runDueJobs()
      .catch((err) => logger.error({ err }, 'Lỗi khi quét job'))
      .finally(() => {
        currentTick = null;
      });
  }, TICK_INTERVAL_MS);
  timer.unref();
  logger.info({ timeZone: env.JOBS_TIMEZONE }, 'Bộ chạy lịch tự động đã bật');
}

/** Dừng quét và chờ lượt đang chạy xong (graceful shutdown). */
async function stop() {
  clearInterval(timer);
  timer = null;
  await currentTick;
}

export const jobsRunner = { runDueJobs, runJobNow, start, stop };
