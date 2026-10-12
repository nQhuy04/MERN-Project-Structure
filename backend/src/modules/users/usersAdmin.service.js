// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 11.
import mongoose from 'mongoose';
import { db } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { mapLeanDocument } from '../../shared/utils/mongo.js';
import { buildPaginationMeta, getSkip } from '../../shared/utils/pagination.js';
import { escapeRegExp } from '../../shared/utils/regex.js';
import { emailService } from '../email/email.service.js';
import { sessionsService } from '../sessions/sessions.service.js';
import { USER_ROLES, USER_STATUSES } from './users.constants.js';
import { User } from './users.model.js';

const LIST_FIELDS = 'email name role avatarMediaId emailVerifiedAt lockedAt lastLoginAt createdAt';

/**
 * Quy tắc "ai được khoá / mở khoá ai" (phân quyền lớp 2 — route chỉ chặn thô theo role):
 * ADMIN chỉ thao tác trên MEMBER; SUPER_ADMIN thao tác trên MEMBER và ADMIN.
 */
const LOCKABLE_TARGET_ROLES = Object.freeze({
  [USER_ROLES.ADMIN]: [USER_ROLES.MEMBER],
  [USER_ROLES.SUPER_ADMIN]: [USER_ROLES.MEMBER, USER_ROLES.ADMIN],
});

/**
 * @param {Object} user document lean
 * @returns {string} USER_STATUSES
 */
function deriveStatus(user) {
  if (user.lockedAt) return USER_STATUSES.LOCKED;
  if (!user.emailVerifiedAt) return USER_STATUSES.UNVERIFIED;
  return USER_STATUSES.ACTIVE;
}

/**
 * @param {string} status USER_STATUSES
 * @returns {Object} điều kiện truy vấn (operator do server dựng → trusted)
 */
function buildStatusFilter(status) {
  const notNull = mongoose.trusted({ $ne: null });
  if (status === USER_STATUSES.LOCKED) return { lockedAt: notNull };
  if (status === USER_STATUSES.UNVERIFIED) return { emailVerifiedAt: null };
  return { lockedAt: null, emailVerifiedAt: notNull };
}

/**
 * **[BÀI 11]** Danh sách user cho trang quản trị.
 *
 * Các bước:
 * 1. Dựng `filter` rỗng, rồi thêm dần:
 *    - có `q` → `new RegExp(escapeRegExp(q), 'i')` và `filter.$or = [{ name: pattern },
 *      { email: pattern }]`;
 *    - có `role` → `filter.role = role`;
 *    - có `status` → `Object.assign(filter, buildStatusFilter(status))` (hàm đã viết sẵn).
 * 2. Chạy **song song** `User.find(filter).select(LIST_FIELDS).sort(sort).skip(getSkip({ page,
 *    limit })).limit(limit).lean()` và `User.countDocuments(filter)`.
 * 3. Trả `{ items, meta }`: `items` = `mapLeanDocument(users)` rồi thêm
 *    `status: deriveStatus(user)`; `meta` = `buildPaginationMeta({ page, limit, total })`.
 *
 * ⚠️ **`escapeRegExp` là bắt buộc.** `q` đến thẳng từ người dùng; không escape thì `.*` khớp mọi
 * người, và một chuỗi như `(a+)+$` khiến regex chạy mãi (ReDoS). Có test cho việc này: _"ký tự
 * đặc biệt trong từ khoá được escape"_.
 *
 * ⚠️ `sort` và `limit` đã được **Zod whitelist** ở tầng route (`listUsersQuerySchema`) — mở
 * `usersAdmin.schema.js` xem. Đừng nhận chuỗi sort tuỳ ý từ client.
 *
 * `status` không phải một trường trong database mà là **trạng thái suy ra** từ `lockedAt` +
 * `emailVerifiedAt` — xem `deriveStatus` và `buildStatusFilter` ở trên.
 *
 * @param {Object} query đã validate: `{ q, role, status, sort, page, limit }`
 * @returns {Promise} resolve `{ items, meta }`
 * @throws {AppError} 501 khi chưa làm
 */
async function list({ q, role, status, sort, page, limit }) {
  return notImplemented('bai-11');
}

/**
 * **[BÀI 11]** Kiểm tra quyền thao tác của `actor` trên user `targetId` — **trái tim của phân
 * quyền lớp 2**. Cả `lock`, `unlock` và `changeRole` đều đi qua đây.
 *
 * Các bước, đúng thứ tự:
 * 1. `actor.userId === targetId` → 403 `CANNOT_MODIFY_SELF` (`'Không thể tự thao tác trên tài
 *    khoản của chính mình'`).
 * 2. `User.findById(targetId)`; không có → 404 `RESOURCE_NOT_FOUND`.
 * 3. `target.role === USER_ROLES.SUPER_ADMIN` → 403 `CANNOT_MODIFY_SUPER_ADMIN` (`'Không thể
 *    thao tác trên Super Admin'`). **Không ai** động được vào Super Admin, kể cả Super Admin khác.
 * 4. `target.role` không nằm trong `allowedTargetRoles` → 403 `INSUFFICIENT_PERMISSION`.
 * 5. Trả `target`.
 *
 * ⚠️ **Thứ tự quan trọng.** "Tự thao tác" kiểm trước mọi thứ để Super Admin không tự khoá chính
 * mình (và khoá luôn hệ thống). "Là Super Admin" kiểm trước "có trong danh sách cho phép" để
 * thông điệp lỗi nói đúng lý do.
 *
 * @param {Object} actor `{ userId, role }` (req.auth)
 * @param {string} targetId
 * @param {string[]} allowedTargetRoles role của đối tượng mà actor được phép thao tác
 * @returns {Promise} resolve user đích
 * @throws {AppError} 404 | 403 CANNOT_MODIFY_SELF | 403 CANNOT_MODIFY_SUPER_ADMIN | 403 INSUFFICIENT_PERMISSION
 */
async function loadManageableTarget(actor, targetId, allowedTargetRoles) {
  return notImplemented('bai-11');
}

/** Dữ liệu vừa thay đổi (vd. role vừa bị đổi bởi người khác) → yêu cầu tải lại. */
function stateChangedError() {
  return new AppError({
    statusCode: 409,
    code: ERROR_CODES.USER_STATE_CHANGED,
    message: 'Thông tin người dùng vừa thay đổi, vui lòng tải lại và thử lại',
  });
}

/**
 * **[BÀI 11]** Khoá tài khoản.
 *
 * Các bước:
 * 1. `loadManageableTarget(actor, targetId, LOCKABLE_TARGET_ROLES[actor.role])`.
 * 2. Đã bị khoá rồi → trả luôn `target`, **không** gửi email lần hai (idempotent).
 * 3. Trong `db.runInTransaction`: `User.findOneAndUpdate` với filter `{ _id: targetId, role:
 *    target.role, lockedAt: null }`, đặt `lockedAt: new Date()`; không khớp → ném
 *    `stateChangedError()`. Rồi `sessionsService.revokeAllForUser(targetId, { session })`.
 * 4. Sau transaction: `emailService.sendAccountLockedEmail({ user: lockedUser })`, trả user.
 *
 * ⚠️ **`role: target.role` trong filter** là chống tranh chấp: giữa lúc kiểm quyền (bước 1) và
 * lúc ghi (bước 3), một Super Admin khác có thể vừa nâng người này lên ADMIN. Nếu không khoá
 * điều kiện theo role cũ, một ADMIN sẽ khoá được một ADMIN khác — điều mà bước kiểm quyền đã
 * cấm. Có test cho đúng tình huống này ở `changeRole`.
 *
 * ⚠️ **Transaction**: khoá mà không thu hồi phiên thì người bị khoá vẫn thao tác tiếp bằng access
 * token còn hạn. Hai việc phải cùng thành công.
 *
 * @param {Object} actor `{ userId, role }`
 * @param {string} targetId
 * @returns {Promise} resolve user sau khi khoá
 * @throws {AppError} 501 khi chưa làm
 */
async function lock(actor, targetId) {
  return notImplemented('bai-11');
}

/**
 * **[BÀI 11]** Mở khoá tài khoản.
 *
 * Giống `lock` nhưng **không cần transaction** (chỉ một thao tác ghi, không phải thu hồi phiên):
 * kiểm quyền → chưa bị khoá thì trả luôn → `findOneAndUpdate` với filter `{ _id, role:
 * target.role, lockedAt: khác null }` đặt `lockedAt: null` → không khớp thì `stateChangedError()`
 * → gửi `sendAccountUnlockedEmail` → trả user.
 *
 * Nhớ `mongoose.trusted` cho `{ $ne: null }`.
 *
 * @param {Object} actor `{ userId, role }`
 * @param {string} targetId
 * @returns {Promise} resolve user sau khi mở khoá
 * @throws {AppError} 501 khi chưa làm
 */
async function unlock(actor, targetId) {
  return notImplemented('bai-11');
}

/**
 * **[BÀI 11]** Nâng / hạ MEMBER ↔ ADMIN.
 *
 * Các bước:
 * 1. `allowedTargets` = `[MEMBER, ADMIN]` **chỉ khi** `actor.role === SUPER_ADMIN`, ngược lại
 *    mảng rỗng. Route đã chặn bằng `authorize(SUPER_ADMIN)`, nhưng service **kiểm lại** — đó là
 *    ý nghĩa của phân quyền hai lớp, và test gọi thẳng service để chứng minh lớp 2 tự đứng vững.
 * 2. `loadManageableTarget(actor, targetId, allowedTargets)`.
 * 3. `newRole === SUPER_ADMIN` → 403 `CANNOT_MODIFY_SUPER_ADMIN` (`'Không thể gán vai trò Super
 *    Admin'`). Hệ thống chỉ có **đúng một** Super Admin, do seed tạo.
 * 4. Role không đổi → trả luôn `target`.
 * 5. `findOneAndUpdate` với filter `{ _id: targetId, role: target.role }`; không khớp →
 *    `stateChangedError()`. Rồi `sendRoleChangedEmail`, trả user.
 *
 * Không cần thu hồi phiên: `resolveAccessToken` (bài 05) đọc role từ database ở **mỗi** request,
 * nên vai trò mới có hiệu lực ngay ở request kế tiếp.
 *
 * @param {Object} actor `{ userId, role }`
 * @param {string} targetId
 * @param {string} newRole MEMBER | ADMIN
 * @returns {Promise} resolve user sau khi đổi role
 * @throws {AppError} 501 khi chưa làm
 */
async function changeRole(actor, targetId, newRole) {
  return notImplemented('bai-11');
}

export const usersAdminService = { list, lock, unlock, changeRole };
