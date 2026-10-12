// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 05.
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { authService } from './auth.service.js';

const BEARER_PREFIX = 'Bearer ';

/**
 * **[BÀI 05]** Bắt buộc đăng nhập. Cổng gác của **mọi** route riêng tư trong dự án.
 *
 * Các bước:
 * 1. Đọc header `authorization` (`req.get('authorization') ?? ''`).
 * 2. Header bắt đầu bằng `BEARER_PREFIX` (hằng số ở đầu file) → lấy phần sau làm access token;
 *    ngược lại coi như chuỗi rỗng.
 * 3. Không có token → ném `AppError` 401 `AUTH_TOKEN_INVALID`, message `'Vui lòng đăng nhập'`.
 * 4. `req.auth = await authService.resolveAccessToken(accessToken)` rồi gọi `next()`.
 *
 * ⚠️ Nhớ gọi `next()`. Quên thì request treo cho tới khi timeout, không báo lỗi gì.
 *
 * Không cần `try/catch`: lỗi JWT (sai chữ ký, hết hạn) do `resolveAccessToken` ném ra, và
 * `errorHandler` đã biết cách dịch chúng thành 401 (bài 01, mục 2.3).
 *
 * Middleware này nằm trong `modules/auth/` chứ không ở `shared/middlewares/` vì nó cần tra
 * session và user trong database — `shared/` không được import `modules/`.
 *
 * @throws {AppError} 401 AUTH_TOKEN_INVALID | 501 khi chưa làm
 */
export async function authenticate(req, _res, next) {
  return notImplemented('bai-05');
}
