// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 14.
import { jobsService } from '../jobs/jobs.service.js';
import { mediaService } from '../media/media.service.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { usersService } from '../users/users.service.js';

/**
 * **[BÀI 14]** Số liệu tổng quan cho trang `/admin`.
 *
 * Các bước: `Promise.all` ba lời gọi **service export** của ba module — `usersService.getStats()`,
 * `mediaService.getStats()`, `jobsService.getStats()` — rồi trả `{ users, media, jobs }`.
 *
 * Module `stats` **không** truy vấn thẳng collection của module khác: mỗi module tự quyết định
 * "thống kê của tôi gồm những gì", và `stats` chỉ gom lại. Thêm một mục thống kê = thêm một
 * `getStats` ở module sở hữu dữ liệu.
 *
 * @returns {Promise} resolve `{ users, media, jobs }`
 * @throws {AppError} 501 khi chưa làm
 */
async function getOverview() {
  return notImplemented('bai-14');
}

export const statsService = { getOverview };
