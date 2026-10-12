// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 05.
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { notImplemented } from '../errors/notImplemented.js';

/**
 * **[BÀI 05]** Phân quyền **lớp 1** (thô) theo role, đặt ngay sau `authenticate` trong chuỗi
 * middleware của route. Quy tắc chi tiết "ai được thao tác trên ai" nằm ở service — lớp 2
 * (bài 11).
 *
 * Đây là một **factory**: `authorize('ADMIN', 'SUPER_ADMIN')` chạy **lúc nạp module** (khi
 * `*.routes.js` được import) và phải **trả về một middleware**. Mọi kiểm tra chỉ xảy ra bên
 * trong middleware đó, tức là lúc có request.
 *
 * TODO(bai-05): viết thân middleware được trả về.
 * 1. `req.auth` không có → `throw new Error('authorize() phải được đặt sau authenticate')`. Đây
 *    là lỗi **lập trình** (đặt sai thứ tự middleware), không phải lỗi người dùng, nên dùng
 *    `Error` thường → `errorHandler` trả 500 và ghi log.
 * 2. `req.auth.role` không nằm trong `allowedRoles` → ném `AppError` 403 `FORBIDDEN`, message
 *    `'Bạn không có quyền thực hiện thao tác này'`.
 * 3. Hợp lệ → `next()`.
 *
 * ⚠️ **Đừng ném lỗi ngay trong thân `authorize`** (ngoài middleware). Hàm này chạy lúc nạp
 * module, nên ném ở đó là **toàn bộ backend không khởi động được** — không phải một request lỗi.
 *
 * `authorize` nằm ở `shared/` (không phải `modules/auth/`) vì nó chỉ so `req.auth.role` với một
 * danh sách, không chạm database.
 *
 * @param {...string} allowedRoles
 * @returns {Function} Express middleware; role không nằm trong danh sách → 403 FORBIDDEN
 */
export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    notImplemented('bai-05');
  };
}
