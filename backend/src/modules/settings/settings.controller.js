// check-conventions: allow-unused-imports — `emailService` bên dưới là gợi ý cho bài 15.
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { emailService } from '../email/email.service.js';
import { settingsService } from './settings.service.js';

async function getPublic(_req, res) {
  sendSuccess(res, await settingsService.getPublic());
}

/** **[BÀI 09]** `GET /admin/settings`. Một dòng, giống `getPublic` ngay phía trên. */
async function listForAdmin(_req, res) {
  return notImplemented('bai-09');
}

/**
 * **[BÀI 09]** `PATCH /admin/settings`. Gọi service với `req.validated.body.values` và
 * `req.auth.userId` (ai sửa), rồi `sendSuccess(res, settings, 'Đã lưu cấu hình')`.
 */
async function update(req, res) {
  return notImplemented('bai-09');
}

/**
 * **[BÀI 15]** `POST /admin/settings/email-test`. Gọi `emailService.sendTestEmail` với
 * `user: req.auth.user` (Super Admin đang đăng nhập — `authenticate` đã gắn sẵn, không phải tra
 * DB lại) và `provider: req.validated.body.provider`, rồi
 * `` sendSuccess(res, result, `Đã gửi email thử tới ${result.to}`) ``.
 */
async function sendTestEmail(req, res) {
  return notImplemented('bai-15');
}

export const settingsController = { getPublic, listForAdmin, update, sendTestEmail };
