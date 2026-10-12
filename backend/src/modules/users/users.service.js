import mongoose from 'mongoose';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { hashPassword } from '../../shared/utils/password.js';
import { USER_ROLES } from './users.constants.js';
import { User } from './users.model.js';

/**
 * Tạo Super Admin nếu hệ thống chưa có (dùng cho seed). Chạy nhiều lần vẫn chỉ có 1 Super
 * Admin: đã có thì bỏ qua, kể cả khi email truyền vào khác email của Super Admin hiện tại.
 * Partial unique index trên `role` là lớp bảo vệ cuối nếu hai tiến trình seed chạy cùng lúc.
 *
 * @param {Object} input dữ liệu đã validate
 * @param {string} input.email
 * @param {string} input.name
 * @param {string} input.password
 * @returns {Promise} resolve `{ created, user }` — `created = false` khi đã có Super Admin
 * @throws {AppError} 409 DUPLICATE_VALUE khi email đã thuộc về một tài khoản khác
 */
async function ensureSuperAdmin({ email, name, password }) {
  const existingSuperAdmin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN });
  if (existingSuperAdmin) return { created: false, user: existingSuperAdmin };

  if (await User.exists({ email })) {
    throw new AppError({
      statusCode: 409,
      code: ERROR_CODES.DUPLICATE_VALUE,
      message: 'Email Super Admin đã được dùng cho một tài khoản khác',
      details: [{ field: 'email', message: 'Giá trị này đã được sử dụng' }],
    });
  }

  const user = await User.create({
    email,
    name,
    passwordHash: await hashPassword(password),
    role: USER_ROLES.SUPER_ADMIN,
    emailVerifiedAt: new Date(),
  });
  return { created: true, user };
}

/**
 * @param {string} email email đã chuẩn hoá (lowercase) qua Zod
 * @returns {Promise} resolve user hoặc `null`
 */
async function findByEmail(email) {
  return User.findOne({ email });
}

/**
 * Tìm user kèm passwordHash (mặc định `select: false`) — chỉ dùng khi cần so mật khẩu.
 * @param {string} email email đã chuẩn hoá qua Zod
 * @returns {Promise} resolve user hoặc `null`
 */
async function findByEmailWithPassword(email) {
  return User.findOne({ email }).select('+passwordHash');
}

/**
 * @param {string} userId
 * @returns {Promise} resolve user hoặc `null`
 */
async function findById(userId) {
  return User.findById(userId);
}

/**
 * **[BÀI 02]** Tạo tài khoản đăng ký bằng email + mật khẩu, CHƯA kích hoạt.
 *
 * Các bước:
 * 1. Gọi `User.create(...)` với ĐÚNG ba trường được liệt kê trong tham số — không truyền cả
 *    object nhận được từ tầng trên vào. `role` và `emailVerifiedAt` để schema tự quyết định
 *    (mặc định `MEMBER` và `null`).
 * 2. Trả về document vừa tạo.
 *
 * Vì sao phải liệt kê từng trường? Nếu truyền nguyên object của người gọi, một trường lạ lọt vào
 * (vd. `role: 'SUPER_ADMIN'`) sẽ được ghi thẳng vào database — lỗi *mass assignment*. Đây là lớp
 * chặn thứ hai, sau Zod ở `validate`.
 *
 * @param {Object} input
 * @param {string} input.email email đã chuẩn hoá (lowercase) qua Zod
 * @param {string} input.name
 * @param {string} input.passwordHash mật khẩu ĐÃ hash (không bao giờ nhận mật khẩu gốc ở đây)
 * @returns {Promise} resolve user vừa tạo (Mongoose document)
 * @throws {AppError} 501 khi chưa làm
 */
async function createLocalUser({ email, name, passwordHash }) {
  return notImplemented('bai-02');
}

/**
 * **[BÀI 03]** Kích hoạt tài khoản.
 *
 * Các bước: **một** lệnh `User.findOneAndUpdate` với điều kiện gồm cả `emailVerifiedAt: null`,
 * đặt `$set: { emailVerifiedAt: new Date() }`, options `returnDocument: 'after'`,
 * `runValidators: true`, và truyền `session` xuống (bài 08 gọi hàm này trong transaction).
 *
 * Điều kiện `emailVerifiedAt: null` nằm trong **filter** chứ không phải trong một câu `if` trước
 * đó. Nhờ vậy giá trị trả về nói lên điều quan trọng: **có user** = đây là lần kích hoạt đầu;
 * **`null`** = tài khoản đã kích hoạt từ trước (hoặc vừa được kích hoạt bởi một request chạy song
 * song). Tầng gọi dựa vào đó để gửi email chào mừng đúng một lần.
 *
 * Đối chiếu `activateByEmailProof` ngay bên dưới — cùng khuôn, khác phần `$unset`.
 *
 * @param {string} userId
 * @param {Object} [options] `{ session }` — transaction session
 * @returns {Promise} resolve user sau khi kích hoạt, hoặc `null` nếu đã kích hoạt từ trước
 * @throws {AppError} 501 khi chưa làm
 */
async function markEmailVerified(userId, { session } = {}) {
  return notImplemented('bai-03');
}

/**
 * Kích hoạt tài khoản khi người dùng chứng minh sở hữu email bằng một kênh KHÁC kênh đăng ký
 * (magic link). Ngoài `emailVerifiedAt`, XOÁ luôn mật khẩu cũ: mật khẩu đó có thể do kẻ gian đặt
 * khi đăng ký trước bằng email của nạn nhân (pre-account takeover) — xem `linkGoogleAccount`.
 * Cập nhật nguyên tử có điều kiện `emailVerifiedAt: null` → biết chính xác đây có phải lần kích
 * hoạt đầu (để gửi email chào mừng đúng 1 lần) và không đụng tới mật khẩu của tài khoản đã kích
 * hoạt từ trước.
 * @param {string} userId
 * @param {Object} [options] `{ session }` — transaction session
 * @returns {Promise} resolve user sau khi kích hoạt, hoặc `null` nếu đã kích hoạt từ trước
 */
async function activateByEmailProof(userId, { session } = {}) {
  return User.findOneAndUpdate(
    { _id: userId, emailVerifiedAt: null },
    { $set: { emailVerifiedAt: new Date() }, $unset: { passwordHash: 1 } },
    { returnDocument: 'after', runValidators: true, session },
  );
}

/**
 * Ghi nhận thời điểm đăng nhập gần nhất.
 * @param {string} userId
 * @returns {Promise} resolve user sau khi cập nhật
 */
async function recordLogin(userId) {
  return User.findByIdAndUpdate(
    userId,
    { $set: { lastLoginAt: new Date() } },
    { returnDocument: 'after', runValidators: true },
  );
}

/**
 * **[BÀI 05]** User tự cập nhật hồ sơ.
 *
 * Các bước: `User.findByIdAndUpdate` với `$set` chỉ chứa **những trường được liệt kê trong tham
 * số** (hiện là `name`), options `returnDocument: 'after'` và `runValidators: true`.
 *
 * Hai điều dễ quên:
 * - Liệt kê từng trường (như `createLocalUser` ở bài 02) → không ai đổi được `role` hay `email`
 *   qua endpoint này. Có test: _"không đổi được email, role hay trạng thái qua endpoint này"_.
 * - `runValidators: true` — mặc định Mongoose **không** chạy validator của schema khi update. Bỏ
 *   nó thì tên rỗng hay quá dài vẫn lọt vào database.
 *
 * @param {string} userId
 * @param {Object} changes `{ name }` đã validate
 * @returns {Promise} resolve user sau khi cập nhật
 * @throws {AppError} 501 khi chưa làm
 */
async function updateProfile(userId, { name }) {
  return notImplemented('bai-05');
}

/**
 * @param {string} userId
 * @returns {Promise} resolve user kèm passwordHash, hoặc `null`
 */
async function findByIdWithPassword(userId) {
  return User.findById(userId).select('+passwordHash');
}

/**
 * **[BÀI 08]** Đặt mật khẩu mới (đã hash ở tầng gọi).
 *
 * Các bước: `User.findByIdAndUpdate` với `$set: { passwordHash }`, options `returnDocument:
 * 'after'`, `runValidators: true`, và **truyền `session` xuống** — hàm này được gọi bên trong
 * transaction ở cả hai luồng của bài.
 *
 * Tham số là `passwordHash`, **không** phải mật khẩu gốc: việc hash thuộc về tầng gọi, còn tầng
 * này chỉ biết ghi. Nhờ vậy không có đường nào vô tình lưu mật khẩu chưa hash.
 *
 * @param {string} userId
 * @param {string} passwordHash
 * @param {Object} [options] `{ session }` — transaction session
 * @returns {Promise} resolve user sau khi cập nhật
 * @throws {AppError} 501 khi chưa làm
 */
async function setPassword(userId, passwordHash, { session } = {}) {
  return notImplemented('bai-08');
}

/**
 * Tên hiển thị của nhiều user (vd. "người sửa gần nhất") trong một truy vấn.
 * @param {Array} userIds
 * @returns {Promise} resolve Map userId (string) → tên
 */
async function findNamesByIds(userIds) {
  if (userIds.length === 0) return new Map();
  const users = await User.find({ _id: mongoose.trusted({ $in: userIds }) })
    .select('name')
    .lean();
  return new Map(users.map((user) => [String(user._id), user.name]));
}

/**
 * **[BÀI 10]** Một dòng: `User.findOne({ googleId })`.
 * @param {string} googleId `sub` trong ID token của Google
 * @returns {Promise} resolve user hoặc `null`
 * @throws {AppError} 501 khi chưa làm
 */
async function findByGoogleId(googleId) {
  return notImplemented('bai-10');
}

/**
 * **[BÀI 10]** Liên kết tài khoản có sẵn (cùng email) với Google.
 *
 * Các bước: dựng `update` theo **hai nhánh** rồi gọi `User.findByIdAndUpdate(user._id, update,
 * { returnDocument: 'after', runValidators: true })`.
 * - Tài khoản **đã** kích hoạt → chỉ `$set: { googleId }`.
 * - Tài khoản **chưa** kích hoạt → `$set: { googleId, emailVerifiedAt: new Date() }` **và**
 *   `$unset: { passwordHash: 1 }`.
 *
 * ⚠️ Nhánh thứ hai là cùng một quy tắc với `activateByEmailProof` (magic link, bài 09): Google
 * vừa xác nhận người này sở hữu hộp thư, nhưng mật khẩu đang lưu có thể do kẻ gian đặt khi đăng
 * ký trước bằng email đó. Giữ lại mật khẩu ấy là trao tài khoản cho hắn.
 *
 * Tài khoản **đã** kích hoạt thì giữ nguyên mật khẩu: chủ tài khoản đã tự xác thực email trước
 * đó, mật khẩu là của chính họ.
 *
 * @param {Object} user user đã tìm theo email
 * @param {string} googleId
 * @returns {Promise} resolve user sau khi liên kết
 * @throws {AppError} 501 khi chưa làm
 */
async function linkGoogleAccount(user, googleId) {
  return notImplemented('bai-10');
}

/**
 * **[BÀI 10]** Tạo tài khoản mới từ Google.
 *
 * Các bước: `User.create` với `email`, `name`, `googleId`, và `emailVerifiedAt: new Date()` —
 * **kích hoạt ngay**, vì Google đã xác nhận email. Không có `passwordHash`: tài khoản này đăng
 * nhập bằng Google, và `verifyCredentials` (bài 04) đã xử lý đúng trường hợp không có mật khẩu.
 *
 * Liệt kê từng trường như `createLocalUser` (bài 02) — `profile` đến từ Google, không truyền
 * nguyên object vào `create`.
 *
 * @param {Object} profile `{ googleId, email, name }`
 * @returns {Promise} resolve user vừa tạo
 * @throws {AppError} 501 khi chưa làm
 */
async function createGoogleUser({ googleId, email, name }) {
  return notImplemented('bai-10');
}

/**
 * **[BÀI 13]** Ảnh nào đang được dùng làm avatar — **module `media` hỏi module `users` qua hàm
 * này** (xem `media.usages.js`).
 *
 * Các bước: dựng `filter` — có `mediaIds` thì `{ avatarMediaId: mongoose.trusted({ $in: mediaIds })
 * }`, bỏ trống thì `{ avatarMediaId: mongoose.trusted({ $ne: null }) }` (mọi ảnh đang dùng). Rồi
 * `User.find(filter).select('avatarMediaId name email').lean()` và map sang
 * `{ mediaId, userId, name, email }` — **ép id về chuỗi** bằng `String(...)`.
 *
 * Đây là cách dự án thay cho **khoá ngoại**: MongoDB không có ràng buộc tham chiếu, nên module
 * `media` không thể tự biết ảnh nào đang được dùng. Mỗi module "dùng ảnh" tự khai báo một hàm
 * như hàm này, và `media.usages.js` gom chúng lại.
 *
 * @param {Array} [mediaIds] chỉ xét các ảnh này; bỏ trống = mọi ảnh
 * @returns {Promise} resolve mảng `{ mediaId, userId, name, email }`
 * @throws {AppError} 501 khi chưa làm
 */
async function findAvatarUsages(mediaIds) {
  return notImplemented('bai-13');
}

/**
 * **[BÀI 13]** Đặt / bỏ ảnh đại diện. Một dòng `User.findByIdAndUpdate` với
 * `$set: { avatarMediaId: mediaId }`, `returnDocument: 'after'`, `runValidators: true`.
 *
 * `mediaId` bằng `null` nghĩa là **gỡ** ảnh. Tính hợp lệ của `mediaId` do
 * `mediaService.assertUsableAsAvatar` kiểm **trước** ở tầng controller — service này chỉ ghi.
 *
 * @param {string} userId
 * @param {string|null} mediaId
 * @returns {Promise} resolve user sau khi cập nhật
 */
async function setAvatar(userId, mediaId) {
  return notImplemented('bai-13');
}

/**
 * **[BÀI 14]** Id tài khoản **chưa kích hoạt** tạo trước một thời điểm (job dọn tài khoản tồn
 * đọng).
 *
 * Các bước: `User.find({ emailVerifiedAt: null, createdAt: mongoose.trusted({ $lt: createdBefore })
 * }).select('_id').lean()` rồi `.map(user => user._id)`.
 *
 * @param {Date} createdBefore
 * @returns {Promise} resolve mảng id
 * @throws {AppError} 501 khi chưa làm
 */
async function findUnverifiedIdsCreatedBefore(createdBefore) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Xoá tài khoản chưa kích hoạt theo danh sách id.
 *
 * Các bước: `User.deleteMany({ _id: mongoose.trusted({ $in: userIds }), emailVerifiedAt: null },
 * { session })`, trả `deletedCount`.
 *
 * ⚠️ Điều kiện `emailVerifiedAt: null` **lặp lại** dù danh sách id đã được lọc ở bước trước. Giữa
 * hai bước, một người trong danh sách có thể vừa bấm link kích hoạt — không kiểm lại là xoá mất
 * tài khoản của một người dùng thật, đúng lúc họ vừa hoàn tất đăng ký.
 *
 * @param {Array} userIds
 * @param {Object} [options] `{ session }` — transaction session
 * @returns {Promise} resolve số tài khoản đã xoá
 * @throws {AppError} 501 khi chưa làm
 */
async function deleteUnverifiedByIds(userIds, { session } = {}) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Người nhận email thông báo: theo vai trò **hoặc** theo danh sách id cụ thể.
 *
 * Các bước: `User.find({ $or: [{ role: trusted({ $in: roles }) }, { _id: trusted({ $in: userIds })
 * }], emailVerifiedAt: trusted({ $ne: null }), lockedAt: null }).select('email name').lean()`.
 *
 * `$or` gộp hai cách chọn, nhưng hai điều kiện còn lại là **VÀ**: chỉ gửi cho tài khoản đã kích
 * hoạt và không bị khoá. Gửi thông báo cho người bị khoá hoặc cho email chưa xác thực là gửi vào
 * hộp thư có thể không thuộc về họ.
 *
 * @param {Object} params `{ roles, userIds }`
 * @returns {Promise} resolve mảng `{ email, name }`
 * @throws {AppError} 501 khi chưa làm
 */
async function findActiveRecipients({ roles = [], userIds = [] }) {
  return notImplemented('bai-14');
}

/**
 * **[BÀI 14]** Số user theo vai trò và theo trạng thái (trang thống kê).
 *
 * Các bước: **một** lệnh `User.aggregate` dùng `$facet` để chạy ba phép đếm song song trong cùng
 * một lượt đi database:
 * - `byRole`: `$group` theo `$role`;
 * - `locked`: `$match { lockedAt: { $ne: null } }` + `$count`;
 * - `unverified`: `$match { emailVerifiedAt: null, lockedAt: null }` + `$count`.
 *
 * Rồi dựng `byRole` với ba khoá mặc định bằng 0 (vai trò chưa ai có vẫn phải hiện ra),
 * `total` = tổng, và `byStatus.ACTIVE = total - locked - unverified`.
 *
 * `$facet` thay cho ba lần `countDocuments` riêng lẻ — một lượt đi database thay vì ba, và mọi
 * con số đến từ **cùng một ảnh chụp** dữ liệu nên luôn cộng khớp với nhau.
 *
 * @returns {Promise} resolve `{ total, byRole: { MEMBER, ADMIN, SUPER_ADMIN }, byStatus: { ACTIVE, LOCKED, UNVERIFIED } }`
 * @throws {AppError} 501 khi chưa làm
 */
async function getStats() {
  return notImplemented('bai-14');
}

export const usersService = {
  findUnverifiedIdsCreatedBefore,
  deleteUnverifiedByIds,
  findActiveRecipients,
  getStats,
  findAvatarUsages,
  setAvatar,
  findByGoogleId,
  linkGoogleAccount,
  createGoogleUser,
  findNamesByIds,
  findByIdWithPassword,
  setPassword,
  updateProfile,
  ensureSuperAdmin,
  findByEmail,
  findByEmailWithPassword,
  recordLogin,
  findById,
  createLocalUser,
  markEmailVerified,
  activateByEmailProof,
};
