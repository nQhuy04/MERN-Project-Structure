// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 04, 06, 07.
import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { REFRESH_TOKEN_TTL_DAYS } from '../../shared/utils/cookies.js';
import { mapLeanDocument } from '../../shared/utils/mongo.js';
import { parseUserAgent } from '../../shared/utils/userAgent.js';
import { generateToken, hashToken } from '../../shared/utils/token.js';
import { Session, USER_AGENT_MAX_LENGTH } from './sessions.model.js';

const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

/** Secret ngay trước lần rotate được chấp nhận thêm khoảng này (nhiều tab refresh cùng lúc). */
export const REFRESH_REUSE_GRACE_MS = 30 * 1000;

const REFRESH_TOKEN_PATTERN = /^([a-f0-9]{24})\.([A-Za-z0-9_-]{20,100})$/;

/**
 * @param {string} sessionId
 * @param {string} secret
 * @returns {string} refresh token gửi cho client (qua cookie httpOnly)
 */
function buildRefreshToken(sessionId, secret) {
  return `${sessionId}.${secret}`;
}

/**
 * **[BÀI 04]** Tạo phiên đăng nhập mới.
 *
 * Các bước:
 * 1. `const secret = generateToken()`.
 * 2. `Session.create` với `secretHash: hashToken(secret)`, `userAgent` **cắt bớt** còn tối đa
 *    `USER_AGENT_MAX_LENGTH` ký tự, `ip`, `lastUsedAt` = bây giờ, `expiresAt` = bây giờ +
 *    `REFRESH_TOKEN_TTL_MS`.
 * 3. Trả `{ session, refreshToken: buildRefreshToken(session._id, secret) }`.
 *
 * Giống token email ở bài 03: **database chỉ lưu hash**, bản gốc chỉ tồn tại trong cookie của
 * người dùng. Ai đọc được collection `sessions` cũng không mạo danh được phiên nào.
 *
 * Refresh token có dạng `<sessionId>.<secret>` (xem `buildRefreshToken`): phần đầu để tra đúng
 * bản ghi mà không phải quét cả bảng, phần sau là bí mật thật sự.
 *
 * ⚠️ Nhớ cắt `userAgent` — chuỗi User-Agent do client gửi, không giới hạn độ dài.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.userAgent]
 * @param {string} [params.ip]
 * @returns {Promise} resolve `{ session, refreshToken }`
 * @throws {AppError} 501 khi chưa làm
 */
async function create({ userId, userAgent = '', ip = '' }) {
  return notImplemented('bai-04');
}

/**
 * **[BÀI 05]** Tìm phiên còn hiệu lực của **đúng** user (gọi ở mỗi request đã đăng nhập).
 *
 * Các bước: một lệnh `Session.findOne` với **ba** điều kiện — `_id` là `sessionId`, `userId`
 * khớp, và `expiresAt` còn hạn (nhớ `mongoose.trusted({ $gt: new Date() })`).
 *
 * Session bị xoá (thu hồi ở bài 07, đăng xuất ở bài 06) hoặc quá hạn → `null` → access token
 * hết tác dụng **ngay lập tức**, không chờ 15 phút.
 *
 * Điều kiện `userId` là bắt buộc: thiếu nó thì ai sửa được payload của token sẽ mượn được phiên
 * của người khác.
 *
 * @param {Object} params
 * @param {string} params.sessionId
 * @param {string} params.userId
 * @returns {Promise} resolve session hoặc `null`
 * @throws {AppError} 501 khi chưa làm
 */
async function findActive({ sessionId, userId }) {
  return notImplemented('bai-05');
}

/**
 * Tách refresh token `<sessionId>.<secret>`; sai định dạng → null.
 * @param {string} refreshToken
 * @returns {Object|null} `{ sessionId, secretHash }`
 */
function parseRefreshToken(refreshToken) {
  const match = REFRESH_TOKEN_PATTERN.exec(refreshToken ?? '');
  if (!match) return null;
  return { sessionId: match[1], secretHash: hashToken(match[2]) };
}

/**
 * **[BÀI 06]** Xoay vòng refresh token — hàm khó nhất của bài, đọc kỹ đề trước khi viết.
 *
 * Mỗi lần dùng, refresh token bị thay bằng cái mới. Nếu secret cũ xuất hiện lại sau đó, gần như
 * chắc chắn có người thứ hai đang giữ bản sao → thu hồi cả phiên. Nhưng nhiều tab của **chính
 * chủ** cũng có thể cùng refresh một lúc, nên cần một cửa sổ ân hạn ngắn.
 *
 * Bốn trường hợp, xử lý theo đúng thứ tự:
 * 1. **Secret hiện tại hợp lệ** → cấp secret mới, lưu secret cũ vào `previousSecretHash`, ghi
 *    `rotatedAt`, `lastUsedAt`, gia hạn `expiresAt`, cập nhật `userAgent` (cắt bớt) + `ip`.
 *    Trả `{ session, refreshToken: <token mới> }`.
 * 2. **Secret "previous", trong vòng `REFRESH_REUSE_GRACE_MS`** kể từ `rotatedAt` → hợp lệ (một
 *    tab khác vừa xoay xong). Trả `{ session, refreshToken: null }` — **không** cấp token mới, vì
 *    cookie của trình duyệt đã được request thắng cập nhật rồi.
 * 3. **Secret "previous", quá hạn ân hạn** → coi là token bị đánh cắp → `deleteOne` cả phiên
 *    (điều kiện gồm `previousSecretHash`), trả `null`.
 * 4. **Không khớp gì** → trả `null`, **không xoá gì cả**.
 *
 * Các bước:
 * - `parseRefreshToken(refreshToken)`; `null` → trả `null` ngay.
 * - Dùng `findOneAndUpdate` **có điều kiện** cho trường hợp 1 (filter: `_id`, `secretHash` hiện
 *   tại, `expiresAt` còn hạn). Thao tác nguyên tử này là thứ bảo đảm hai request đồng thời không
 *   thể cùng "thắng" — giống `consume` ở bài 03.
 * - Không khớp → `findOne` cho trường hợp 2 (filter: `_id`, `previousSecretHash`, `rotatedAt`
 *   lớn hơn `now - REFRESH_REUSE_GRACE_MS`, `expiresAt` còn hạn).
 * - Không khớp nốt → `deleteOne` theo `_id` + `previousSecretHash` (trường hợp 3). Nếu secret
 *   chẳng khớp gì thì lệnh này **không xoá gì**, đúng như trường hợp 4.
 *
 * ⚠️ Vì sao trường hợp 4 không được xoá phiên? `sessionId` nằm ở nửa đầu của refresh token và
 * không phải bí mật. Nếu "secret sai" cũng thu hồi phiên, ai đoán được `sessionId` sẽ đăng xuất
 * người khác từ xa — biến cơ chế chống trộm thành công cụ phá hoại.
 *
 * ⚠️ Nhớ `mongoose.trusted(...)` cho mọi operator `$gt` tự dựng.
 *
 * @param {Object} params
 * @param {string} params.refreshToken
 * @param {string} [params.userAgent]
 * @param {string} [params.ip]
 * @returns {Promise} resolve `{ session, refreshToken }` (`refreshToken = null` ở trường hợp 2)
 *   hoặc `null` khi không hợp lệ
 * @throws {AppError} 501 khi chưa làm
 */
async function rotate({ refreshToken, userAgent = '', ip = '' }) {
  return notImplemented('bai-06');
}

/**
 * **[BÀI 06]** Thu hồi phiên ứng với refresh token (đăng xuất).
 *
 * Các bước: `parseRefreshToken`; sai định dạng → `return` im lặng. Còn lại: `Session.deleteOne`
 * với `_id` là `sessionId` **và** một điều kiện `$or` gồm `secretHash` hoặc `previousSecretHash`
 * khớp — chấp nhận cả secret vừa bị xoay để đăng xuất từ một tab đang dùng token cũ.
 *
 * ⚠️ Điều kiện secret là **bắt buộc**: chỉ biết `sessionId` (phần công khai của token) mà xoá
 * được phiên thì bất kỳ ai cũng đăng xuất được người khác. Có test cho việc này: _"chỉ biết
 * sessionId (secret sai) → không xoá được phiên của người khác"_.
 *
 * ⚠️ Toán tử `$or` ở đây do **server** tự dựng nên không bị `sanitizeFilter` chặn; nhưng hai giá
 * trị bên trong phải là hash do server tính, không phải dữ liệu thô từ client.
 *
 * @param {string} refreshToken
 * @returns {Promise} resolve khi xong (token sai → không làm gì)
 * @throws {AppError} 501 khi chưa làm
 */
async function revokeByRefreshToken(refreshToken) {
  return notImplemented('bai-06');
}

/**
 * Thu hồi một phiên theo id (dùng khi user bị khoá giữa chừng...).
 * @param {string} sessionId
 * @returns {Promise} resolve khi xong
 */
async function revoke(sessionId) {
  await Session.deleteOne({ _id: sessionId });
}

/**
 * **[BÀI 07]** Danh sách thiết bị đang đăng nhập của user, mới dùng gần nhất lên đầu.
 *
 * Các bước:
 * 1. `Session.find({ userId, expiresAt: còn hạn })` — lọc theo `userId` là điều kiện **sở hữu**,
 *    không phải cho đẹp.
 * 2. `.select('userAgent ip lastUsedAt createdAt')` — **không** lấy `secretHash` /
 *    `previousSecretHash`. Có test kiểm điều này: _"không lộ secret"_.
 * 3. `.sort({ lastUsedAt: -1 })` rồi `.lean()`.
 * 4. Kết quả `.lean()` **phải** đi qua `mapLeanDocument(...)` (đổi `_id` thành `id`, bỏ `__v`) —
 *    quy ước chung của dự án, xem `docs/01`.
 * 5. Với mỗi phiên, thêm `device: parseUserAgent(session.userAgent)` và
 *    `isCurrent: session.id === currentSessionId`.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.currentSessionId phiên đang gọi API (đánh dấu `isCurrent`)
 * @returns {Promise} resolve mảng `{ id, device, ip, userAgent, lastUsedAt, createdAt, isCurrent }`
 * @throws {AppError} 501 khi chưa làm
 */
async function listForUser({ userId, currentSessionId }) {
  return notImplemented('bai-07');
}

/**
 * Thu hồi một phiên KHÁC của chính user. Điều kiện truy vấn có userId → không thu hồi được
 * phiên của người khác (trả 404 như không tồn tại, không lộ là phiên có thật).
 * **[BÀI 07]** Thu hồi MỘT phiên khác của chính mình.
 *
 * Các bước:
 * 1. `sessionId === currentSessionId` → ném 400 `CANNOT_REVOKE_CURRENT_SESSION`, message
 *    `'Không thể thu hồi phiên hiện tại — hãy dùng Đăng xuất'`. Thu hồi phiên của chính mình
 *    giữa chừng sẽ để lại trạng thái lỡ dở; đã có nút Đăng xuất lo việc đó.
 * 2. `Session.deleteOne({ _id: sessionId, userId })` — **`userId` trong filter là lớp chống
 *    IDOR**, xem ghi chú bên dưới.
 * 3. `deletedCount === 0` → ném 404 `RESOURCE_NOT_FOUND`, message `'Không tìm thấy phiên đăng
 *    nhập'`.
 *
 * ⚠️ **Chống IDOR**: id của phiên nằm trong URL, người dùng đổi được. Nếu chỉ `deleteOne({ _id })`
 * thì ai cũng thu hồi phiên của người khác. Đặt `userId` **vào filter** thay vì tra trước rồi so
 * sánh: không còn khoảng trống giữa lúc đọc và lúc ghi, và phiên của người khác tự nhiên rơi vào
 * nhánh `deletedCount === 0`.
 *
 * ⚠️ **404 chứ không phải 403** cho phiên của người khác: 403 xác nhận "phiên này có tồn tại,
 * chỉ là không phải của bạn" — một kênh dò thông tin. 404 không nói gì cả.
 *
 * @param {Object} params `{ userId, sessionId, currentSessionId }`
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 400 CANNOT_REVOKE_CURRENT_SESSION | 404 RESOURCE_NOT_FOUND
 */
async function revokeForUser({ userId, sessionId, currentSessionId }) {
  return notImplemented('bai-07');
}

/**
 * **[BÀI 07]** Đăng xuất mọi thiết bị **khác**, giữ phiên hiện tại.
 *
 * Các bước: `Session.deleteMany({ userId, _id: khác currentSessionId }, { session })`, trả
 * `deletedCount`. Operator `$ne` do server dựng → bọc `mongoose.trusted(...)`.
 *
 * Tham số `session` (tuỳ chọn) là transaction session — bài 08 và 11 gọi hàm này bên trong
 * transaction, nên phải truyền tiếp xuống.
 *
 * @param {Object} params `{ userId, currentSessionId, session? }`
 * @returns {Promise} resolve số phiên đã thu hồi
 * @throws {AppError} 501 khi chưa làm
 */
async function revokeOthers({ userId, currentSessionId, session }) {
  return notImplemented('bai-07');
}

/**
 * Thu hồi MỌI phiên của user (đặt lại mật khẩu, bị khoá...).
 * @param {string} userId
 * @param {Object} [options] `{ session }` — transaction session
 * @returns {Promise} resolve số phiên đã thu hồi
 */
async function revokeAllForUser(userId, { session } = {}) {
  const { deletedCount } = await Session.deleteMany({ userId }, { session });
  return deletedCount;
}

export const sessionsService = {
  create,
  findActive,
  rotate,
  revokeByRefreshToken,
  revoke,
  listForUser,
  revokeForUser,
  revokeOthers,
  revokeAllForUser,
};
