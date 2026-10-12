// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 03.
import mongoose from 'mongoose';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { generateToken, hashToken } from '../../shared/utils/token.js';
import { EmailToken } from './emailTokens.model.js';

/**
 * **[BÀI 03]** Phát hành token mới cho user và trả về **token dạng gốc** để gửi qua email.
 *
 * Các bước:
 * 1. Xoá mọi token cùng `userId` + `type` đang có (`EmailToken.deleteMany`) → chỉ link mới nhất
 *    còn dùng được. Gửi lại email lần 2 thì link lần 1 phải chết.
 * 2. Sinh token ngẫu nhiên bằng `generateToken()` (đã import sẵn).
 * 3. `EmailToken.create` với `tokenHash: hashToken(token)` và `expiresAt` = bây giờ + `ttlMs`.
 * 4. Trả về **token gốc** (bước 3 chỉ lưu hash).
 *
 * Vì sao chỉ lưu hash? Token trong database cũng là "mật khẩu dùng một lần". Ai đọc được database
 * (bản backup lọt ra, truy vấn qua lỗ hổng) sẽ đặt lại được mật khẩu của mọi tài khoản. Lưu hash
 * SHA-256 thì bản ghi bị lộ cũng không dùng để tạo link hợp lệ được.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.type EMAIL_TOKEN_TYPES
 * @param {number} params.ttlMs thời hạn (ms)
 * @returns {Promise} resolve token dạng gốc (chỉ gửi qua email, KHÔNG lưu vào DB)
 * @throws {AppError} 501 khi chưa làm
 */
async function issue({ userId, type, ttlMs }) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 03]** Tiêu thụ token: đánh dấu đã dùng và trả về bản ghi, hoặc `null` nếu không dùng được.
 *
 * Phải là **MỘT lệnh cập nhật nguyên tử có điều kiện** (`findOneAndUpdate`), không phải "tìm rồi
 * kiểm tra rồi cập nhật". Nếu tách làm nhiều bước, hai request tới cùng lúc với cùng một token sẽ
 * cùng đọc thấy `usedAt: null` rồi cùng thành công — token dùng một lần thành dùng nhiều lần. Có
 * test cho đúng tình huống đó: _"2 request cùng lúc với cùng token → đúng 1 request thành công"_.
 *
 * Các bước:
 * 1. `EmailToken.findOneAndUpdate` với điều kiện: `tokenHash` khớp `hashToken(token)`, đúng
 *    `type`, `usedAt: null`, và `expiresAt` lớn hơn thời điểm hiện tại.
 * 2. Cập nhật `$set: { usedAt: new Date() }`.
 * 3. Options: `returnDocument: 'after'`, `runValidators: true`, và truyền `session` xuống (bài 08
 *    gọi hàm này bên trong transaction).
 *
 * ⚠️ Operator do server tự dựng (`{ $gt: ... }`) phải bọc `mongoose.trusted(...)`: `sanitizeFilter`
 * của dự án chặn mọi object có key bắt đầu bằng `$` để chống NoSQL injection. Xem `docs/01`.
 *
 * @param {Object} params
 * @param {string} params.token token dạng gốc từ link
 * @param {string} params.type EMAIL_TOKEN_TYPES
 * @param {Object} [params.session] transaction session (nếu chạy trong transaction)
 * @returns {Promise} resolve bản ghi token đã đánh dấu dùng, hoặc `null` nếu sai/hết hạn/đã dùng
 * @throws {AppError} 501 khi chưa làm
 */
async function consume({ token, type, session }) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 03]** Vô hiệu mọi token cùng loại của user (vd. huỷ link kích hoạt cũ khi có người
 * đăng ký lại bằng email chưa kích hoạt).
 *
 * Các bước: một lệnh `EmailToken.deleteMany` theo `userId` + `type`. Không trả về gì.
 * Tham khảo `revokeAllForUsers` bên dưới (đã viết sẵn).
 *
 * @param {Object} params `{ userId, type }`
 * @returns {Promise} resolve khi đã xoá
 * @throws {AppError} 501 khi chưa làm
 */
async function revokeAll({ userId, type }) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 14]** Xoá mọi token của nhiều user (dùng khi dọn tài khoản chưa kích hoạt).
 *
 * Các bước: `EmailToken.deleteMany({ userId: mongoose.trusted({ $in: userIds }) }, { session })`,
 * trả `deletedCount`. Nhớ truyền `session` xuống — hàm này chạy trong transaction của job.
 *
 * @param {Array} userIds
 * @param {Object} [options] `{ session }` — transaction session
 * @returns {Promise} resolve số token đã xoá
 * @throws {AppError} 501 khi chưa làm
 */
async function revokeAllForUsers(userIds, { session } = {}) {
  return notImplemented('bai-14');
}

export const emailTokensService = { issue, consume, revokeAll, revokeAllForUsers };
