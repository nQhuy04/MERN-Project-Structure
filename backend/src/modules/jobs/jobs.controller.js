// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 14.
import { sendCreated, sendPaginated, sendSuccess } from '../../shared/utils/response.js';
import { jobsRunner } from './jobs.runner.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { jobsService } from './jobs.service.js';

async function listTypes(_req, res) {
  sendSuccess(res, jobsService.listTypes());
}

/** **[BÀI 14]** `GET /admin/jobs`. Một dòng, giống `listTypes` ngay phía trên. */
async function list(_req, res) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** `POST /admin/jobs`. `sendCreated` (201) với kết quả của
 * `jobsService.create(req.validated.body, req.auth.userId)` và message `'Đã tạo job'`.
 */
async function create(req, res) {
  return notImplemented('bai-14');
}

/** **[BÀI 14]** `PATCH /admin/jobs/:id`. Message `'Đã lưu job'`. */
async function update(req, res) {
  return notImplemented('bai-14');
}

/** **[BÀI 14]** `POST /admin/jobs/:id/pause`. `setPaused(id, true)`, message `'Đã tạm dừng job'`. */
async function pause(req, res) {
  return notImplemented('bai-14');
}

/** **[BÀI 14]** `POST /admin/jobs/:id/resume`. `setPaused(id, false)`, message `'Đã tiếp tục job'`. */
async function resume(req, res) {
  return notImplemented('bai-14');
}

/** **[BÀI 14]** `DELETE /admin/jobs/:id`. Message `'Đã xoá job'`. */
async function remove(req, res) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** `POST /admin/jobs/:id/run`. Lấy `run` từ service, rồi `sendSuccess(res, run, ...)`
 * với message **tuỳ theo `run.status`**: `'Job đã chạy xong'` khi `SUCCESS`, `'Job chạy thất bại'`
 * khi không.
 *
 * Job chạy xong nhưng handler lỗi **không phải** lỗi HTTP: request thành công, kết quả là "lần
 * chạy đó thất bại". Vì vậy trả 200 kèm thông điệp khác, không ném `AppError`.
 */
async function runNow(req, res) {
  return notImplemented('bai-14');
}

/** **[BÀI 14]** `GET /admin/jobs/:id/runs`. Danh sách phân trang → `sendPaginated`. */
async function listRuns(req, res) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** `POST /jobs/trigger` — cron **bên ngoài** gọi định kỳ.
 *
 * Một dòng: `jobsRunner.runDueJobs()` rồi `sendSuccess(res, { executedCount })`.
 *
 * Vì sao cần endpoint này khi đã có bộ chạy trong tiến trình? Trên nền tảng miễn phí (Render
 * free), server **ngủ** khi không có request — và bộ chạy theo `setInterval` ngủ theo. Một dịch
 * vụ cron bên ngoài gọi endpoint này vừa đánh thức server vừa kích hoạt các job đến hạn.
 *
 * Route đã gắn `requireJobsSecret` (header `X-Jobs-Secret`, so sánh timing-safe) — đọc
 * `jobs.middleware.js`.
 */
async function trigger(_req, res) {
  return notImplemented('bai-14');
}

export const jobsController = {
  listTypes,
  list,
  create,
  update,
  pause,
  resume,
  remove,
  runNow,
  listRuns,
  trigger,
};
