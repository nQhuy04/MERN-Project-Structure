// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 07.
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { sessionsService } from './sessions.service.js';

/**
 * **[BÀI 07]** `GET /sessions`. Gọi `sessionsService.listForUser` với `userId` và
 * `currentSessionId` lấy từ `req.auth` (do `authenticate` đặt, bài 05), rồi `sendSuccess`.
 */
async function list(req, res) {
  return notImplemented('bai-07');
}

/**
 * **[BÀI 07]** `DELETE /sessions/:id`. Gọi `sessionsService.revokeForUser` với `userId` +
 * `currentSessionId` từ `req.auth` và `sessionId` từ **`req.validated.params.id`**, rồi
 * `sendSuccess(res, null, 'Đã thu hồi phiên đăng nhập')`.
 */
async function revoke(req, res) {
  return notImplemented('bai-07');
}

/**
 * **[BÀI 07]** `DELETE /sessions`. Gọi `sessionsService.revokeOthers` (nó trả về số phiên đã
 * thu hồi), rồi `sendSuccess` với data `{ revokedCount }` và message dạng
 * "Đã đăng xuất N thiết bị khác" — frontend hiện thẳng message này.
 */
async function revokeOthers(req, res) {
  return notImplemented('bai-07');
}

export const sessionsController = { list, revoke, revokeOthers };
