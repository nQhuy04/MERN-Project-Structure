// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 02, 03.
import { db } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { getDummyPasswordHash, hashPassword, verifyPassword } from '../../shared/utils/password.js';
import { googleOAuth } from '../../shared/lib/googleOAuth.js';
import { safeEqual, signAccessToken, verifyAccessToken } from '../../shared/utils/token.js';
import { emailService } from '../email/email.service.js';
import { sessionsService } from '../sessions/sessions.service.js';
import { SETTING_KEYS } from '../settings/settings.registry.js';
import { settingsService } from '../settings/settings.service.js';
import { usersService } from '../users/users.service.js';
import { googleCallbackQuerySchema } from './auth.schema.js';
import {
  MAGIC_LINK_TTL_MINUTES,
  MAGIC_LINK_TTL_MS,
  RESET_PASSWORD_TTL_MINUTES,
  RESET_PASSWORD_TTL_MS,
  VERIFY_EMAIL_TTL_HOURS,
  VERIFY_EMAIL_TTL_MS,
} from './auth.constants.js';
import { EMAIL_TOKEN_TYPES } from './emailTokens.model.js';
import { emailTokensService } from './emailTokens.service.js';

/**
 * **[BÀI 03]** Phát hành token kích hoạt và gửi email xác thực.
 *
 * Các bước: `await emailTokensService.issue({ userId, type, ttlMs })` với
 * `type = EMAIL_TOKEN_TYPES.VERIFY_EMAIL` và `ttlMs = VERIFY_EMAIL_TTL_MS` (hằng số đã import),
 * rồi gọi `emailService.sendVerifyEmail({ user, token, expiresInHours: VERIFY_EMAIL_TTL_HOURS })`.
 *
 * `sendVerifyEmail` gửi chạy nền nên **không** `await` nó.
 *
 * @param {Object} user
 * @returns {Promise} resolve khi đã phát hành token và xếp email vào hàng gửi
 * @throws {AppError} 501 khi chưa làm
 */
async function sendVerification(user) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 03]** Email đã có tài khoản **chưa kích hoạt** mà có người đăng ký lại.
 *
 * Không ghi đè mật khẩu của bản ghi đang có; thay vào đó gửi link **đặt mật khẩu** cho chủ hộp
 * thư. Kẻ đăng ký trước bằng email của người khác vì thế không giữ được mật khẩu của mình —
 * chống *pre-account takeover*.
 *
 * Các bước:
 * 1. `await emailTokensService.revokeAll({ userId, type: EMAIL_TOKEN_TYPES.VERIFY_EMAIL })` —
 *    huỷ mọi link kích hoạt cũ. **Bước này bắt buộc**: link kích hoạt cũ có thể đang nằm trong
 *    tay kẻ gian, bấm vào là tài khoản được kích hoạt kèm mật khẩu của họ.
 * 2. `await emailTokensService.issue(...)` với `type = EMAIL_TOKEN_TYPES.RESET_PASSWORD` và
 *    `ttlMs = RESET_PASSWORD_TTL_MS`.
 * 3. `emailService.sendSetPasswordEmail({ user, token, expiresInMinutes: RESET_PASSWORD_TTL_MINUTES })`.
 *
 * @param {Object} user
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 501 khi chưa làm
 */
async function sendSetPassword(user) {
  return notImplemented('bai-03');
}

/**
 * @throws {AppError} 403 REGISTRATION_DISABLED khi Super Admin tắt đăng ký
 */
async function assertRegistrationEnabled() {
  if (!(await settingsService.get(SETTING_KEYS.REGISTRATION_ENABLED))) {
    throw new AppError({
      statusCode: 403,
      code: ERROR_CODES.REGISTRATION_DISABLED,
      message: 'Hệ thống đang tạm dừng đăng ký tài khoản mới',
    });
  }
}

/**
 * **[BÀI 02]** Đăng ký tài khoản mới (chưa kích hoạt).
 *
 * Các bước cho bài 02 — chỉ lo trường hợp **email chưa có ai dùng**:
 * 1. `await assertRegistrationEnabled()` — Super Admin có thể tắt đăng ký (bài 09).
 * 2. Hash mật khẩu bằng `hashPassword` (đã import sẵn). Hash **trước** khi tra email, và hash cả
 *    khi cuối cùng không dùng tới: bcrypt chậm có chủ đích, nếu chỉ hash ở nhánh "email mới" thì
 *    thời gian phản hồi của hai nhánh lệch nhau rõ rệt và kẻ tấn công dò được email nào đã đăng ký.
 * 3. `usersService.findByEmail(email)` — chưa có ai dùng thì gọi `usersService.createLocalUser`
 *    với `{ email, name, passwordHash }` rồi `return`.
 * 4. Không trả về gì (controller tự trả thông điệp chung).
 *
 * **Bài 03 sẽ bổ sung** vào chính hàm này: gửi email xác thực sau khi tạo tài khoản, và xử lý hai
 * trường hợp email đã tồn tại (đã kích hoạt / chưa kích hoạt). Bài 02 cứ để nguyên phần đó.
 *
 * @param {Object} input dữ liệu đã validate
 * @param {string} input.email
 * @param {string} input.name
 * @param {string} input.password mật khẩu gốc — hash trong hàm này, không đi tiếp xuống service khác
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 403 REGISTRATION_DISABLED khi Super Admin tắt đăng ký
 */
async function register({ email, name, password }) {
  return notImplemented('bai-02');
}

/**
 * **[BÀI 03]** Xác thực email bằng token trong link.
 *
 * Các bước:
 * 1. `await emailTokensService.consume({ token, type: EMAIL_TOKEN_TYPES.VERIFY_EMAIL })`.
 * 2. Trả về `null` (sai / hết hạn / đã dùng) → ném `AppError` 400 `TOKEN_INVALID`, message
 *    `'Liên kết xác thực không hợp lệ hoặc đã hết hạn'`. **Một thông điệp cho cả ba trường hợp**:
 *    nói rõ "token đã dùng rồi" là xác nhận cho kẻ dò rằng token đó từng tồn tại.
 * 3. `await usersService.markEmailVerified(emailToken.userId)`. Hàm đó trả `null` nếu tài khoản
 *    **đã** kích hoạt từ trước.
 * 4. Chỉ khi bước 3 trả về user (tức đây là lần kích hoạt ĐẦU) mới gọi
 *    `emailService.sendWelcomeEmail({ user })` — nhờ vậy email chào mừng gửi đúng một lần, kể cả
 *    khi hai request tới cùng lúc.
 *
 * Giữ nguyên mật khẩu (khác `loginWithMagicLink` ở bài 09): link này gửi cho chính người vừa đăng
 * ký, ngay trong luồng đăng ký — người bấm link và người đặt mật khẩu là một. Xem `docs/03` §7.
 *
 * @param {Object} input `{ token }`
 * @returns {Promise} resolve khi đã kích hoạt
 * @throws {AppError} 400 TOKEN_INVALID khi token sai, hết hạn hoặc đã dùng
 */
async function verifyEmail({ token }) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 03]** Gửi lại email xác thực.
 *
 * Các bước: tìm user theo email; **không có user hoặc user đã kích hoạt → `return` im lặng**;
 * còn lại thì `await sendVerification(user)`.
 *
 * Controller luôn trả cùng một thông điệp, kể cả khi không gửi gì — nếu báo "email không tồn tại"
 * thì endpoint này thành công cụ dò xem email nào đã đăng ký.
 *
 * @param {Object} input `{ email }`
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 501 khi chưa làm
 */
async function resendVerification({ email }) {
  return notImplemented('bai-03');
}

/**
 * **[BÀI 04]** Kiểm tra email + mật khẩu.
 *
 * Các bước:
 * 1. `usersService.findByEmailWithPassword(email)` — bản thường không đọc `passwordHash`
 *    (`select: false` trong model).
 * 2. `passwordHash` để so = hash của user, hoặc `await getDummyPasswordHash()` nếu không có user.
 * 3. `await verifyPassword(password, passwordHash)`.
 * 4. **Không có user, user chưa có mật khẩu, hoặc mật khẩu sai → cùng MỘT lỗi**: `AppError` 400
 *    `INVALID_CREDENTIALS`, message `'Email hoặc mật khẩu không đúng'`.
 * 5. Hợp lệ → trả về user.
 *
 * Hai điểm dễ bỏ sót:
 * - **Chạy bcrypt cả khi email không tồn tại** (hash giả). Nếu thoát sớm, request với email lạ
 *   trả về trong ~1ms còn email có thật mất ~200ms — bấm giờ là dò được email nào đã đăng ký.
 * - Tài khoản **chỉ đăng nhập bằng Google** (bài 10) không có `passwordHash`; nó phải rơi vào
 *   cùng nhánh lỗi này, không được báo riêng.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise} resolve user (đã kèm passwordHash)
 * @throws {AppError} 400 INVALID_CREDENTIALS
 */
async function verifyCredentials(email, password) {
  return notImplemented('bai-04');
}

/**
 * **[BÀI 04]** Kiểm tra tài khoản có được phép đăng nhập không.
 *
 * Các bước: `user.lockedAt` có giá trị → ném 403 `ACCOUNT_LOCKED` (`'Tài khoản đã bị khoá. Vui
 * lòng liên hệ quản trị viên'`); `user.emailVerifiedAt` trống → ném 403 `EMAIL_NOT_VERIFIED`
 * (`'Tài khoản chưa được kích hoạt. Vui lòng xác thực email'`). Hợp lệ thì không trả gì.
 *
 * **Chỉ được gọi SAU khi đã xác minh mật khẩu.** Nếu báo "tài khoản bị khoá" trước khi biết người
 * gọi có đúng mật khẩu hay không, thì bất kỳ ai cũng dò được email nào đã đăng ký và trạng thái
 * của chúng. Có test cho việc này: _"chỉ báo ACCOUNT_LOCKED khi mật khẩu đúng"_.
 *
 * Bài 09 (magic link) và bài 10 (Google) dùng lại hàm này.
 *
 * @param {Object} user
 * @throws {AppError} 403 ACCOUNT_LOCKED | 403 EMAIL_NOT_VERIFIED | 501 khi chưa làm
 */
function assertCanSignIn(user) {
  return notImplemented('bai-04');
}

/**
 * **[BÀI 04]** Tạo phiên đăng nhập cho user đã qua kiểm tra. Dùng chung cho đăng nhập bằng mật
 * khẩu, magic link (bài 09) và Google (bài 10) — viết một lần, ba chỗ dùng.
 *
 * Các bước:
 * 1. `await sessionsService.create({ userId, userAgent, ip })` → `{ session, refreshToken }`.
 * 2. `await usersService.recordLogin(user._id)` → user đã cập nhật `lastLoginAt`.
 * 3. Trả về `{ accessToken, refreshToken, user }`, trong đó `accessToken` =
 *    `signAccessToken({ userId: user._id, sessionId: session._id })`.
 *
 * Access token **chỉ chứa `sub` (userId) và `sid` (sessionId)** — không nhét role hay email vào.
 * Role đọc từ database ở mỗi request (`resolveAccessToken`, bài 05) nên admin đổi vai trò là có
 * hiệu lực ngay, không phải chờ token cũ hết hạn.
 *
 * @param {Object} user
 * @param {Object} client `{ userAgent, ip }`
 * @returns {Promise} resolve `{ accessToken, refreshToken, user }`
 * @throws {AppError} 501 khi chưa làm
 */
async function startSession(user, { userAgent, ip }) {
  return notImplemented('bai-04');
}

/**
 * **[BÀI 04]** Đăng nhập bằng email + mật khẩu.
 *
 * Các bước: ba dòng, gọi lần lượt `verifyCredentials` → `assertCanSignIn` → `startSession`.
 * **Thứ tự quan trọng** — xem ghi chú ở `assertCanSignIn`.
 *
 * @param {Object} credentials `{ email, password }` đã validate
 * @param {Object} client `{ userAgent, ip }` — để hiển thị trong danh sách phiên
 * @returns {Promise} resolve `{ accessToken, refreshToken, user }`
 * @throws {AppError} 400 INVALID_CREDENTIALS | 403 ACCOUNT_LOCKED | 403 EMAIL_NOT_VERIFIED
 */
async function login({ email, password }, client) {
  return notImplemented('bai-04');
}

/**
 * **[BÀI 05]** Xác thực access token cho **mỗi** request.
 *
 * Các bước:
 * 1. `verifyAccessToken(accessToken)` → `{ sub, sid }`. Hàm này ném lỗi nếu chữ ký sai hoặc
 *    token hết hạn — **đừng bắt**, để `errorHandler` dịch thành 401 đúng mã.
 * 2. Tra **song song** (`Promise.all`) session và user: `sessionsService.findActive({ sessionId,
 *    userId })` và `usersService.findById(userId)`.
 * 3. Thiếu một trong hai → 401 `AUTH_TOKEN_INVALID`, message `'Phiên đăng nhập đã hết hạn hoặc
 *    bị thu hồi'`.
 * 4. `user.lockedAt` có giá trị → 403 `ACCOUNT_LOCKED`.
 * 5. Trả `{ userId, sessionId, role, user }` — hai id ép về chuỗi bằng `String(...)`.
 *
 * **Vì sao phải tra database ở mỗi request** dù token còn hạn? Vì token đã phát ra thì không thu
 * hồi được. Tra DB làm ba việc có hiệu lực **ngay**: thu hồi phiên (bài 07), khoá tài khoản
 * (bài 11), đổi vai trò (bài 11). Nếu chỉ tin nội dung token, người vừa bị hạ quyền vẫn vào được
 * khu quản trị thêm 15 phút nữa.
 *
 * **Vì sao `findActive` phải lọc theo CẢ `sessionId` và `userId`?** Nếu chỉ tra theo `sessionId`,
 * ai sửa được payload token (đổi `sub`) sẽ dùng phiên của người khác. Có test cho việc này:
 * _"session của user khác không dùng được (sub và sid phải khớp)"_.
 *
 * @param {string} accessToken
 * @returns {Promise} resolve `{ userId, sessionId, role, user }`
 * @throws {Error} lỗi JWT (errorHandler map thành 401)
 * @throws {AppError} 401 AUTH_TOKEN_INVALID khi phiên/user không còn | 403 ACCOUNT_LOCKED
 */
async function resolveAccessToken(accessToken) {
  return notImplemented('bai-05');
}

/**
 * **[BÀI 06]** Đổi refresh token (từ cookie) lấy access token mới, đồng thời xoay vòng refresh
 * token.
 *
 * Các bước:
 * 1. `await sessionsService.rotate({ refreshToken, ...client })`.
 * 2. Trả `null` → ném `AppError` 401 `AUTH_TOKEN_INVALID`, message `'Phiên đăng nhập đã hết hạn,
 *    vui lòng đăng nhập lại'`.
 * 3. Lấy `session` từ kết quả, `usersService.findById(session.userId)`.
 * 4. **Không có user, hoặc user bị khoá** → `await sessionsService.revoke(session._id)` rồi ném
 *    lỗi: bị khoá thì 403 `ACCOUNT_LOCKED`, không còn user thì 401 `AUTH_TOKEN_INVALID`.
 *    Thu hồi phiên **trước khi** ném — người vừa bị khoá không được giữ phiên sống tiếp.
 * 5. Trả `{ accessToken: signAccessToken({ userId, sessionId }), refreshToken:
 *    rotation.refreshToken, user }`. Chú ý `rotation.refreshToken` có thể là `null` (trường hợp
 *    ân hạn) — controller sẽ chỉ đặt lại cookie khi nó khác `null`.
 *
 * @param {string} refreshToken
 * @param {Object} client `{ userAgent, ip }`
 * @returns {Promise} resolve `{ accessToken, refreshToken, user }` — `refreshToken = null` khi
 *   không cần đặt lại cookie (request song song trong thời gian ân hạn)
 * @throws {AppError} 401 AUTH_TOKEN_INVALID | 403 ACCOUNT_LOCKED
 */
async function refresh(refreshToken, client) {
  return notImplemented('bai-06');
}

/**
 * **[BÀI 06]** Đăng xuất phiên hiện tại.
 *
 * Các bước: có `refreshToken` → `await sessionsService.revokeByRefreshToken(refreshToken)`;
 * không có → không làm gì.
 *
 * **Luôn thành công (idempotent)**, kể cả khi không có cookie hay token đã hỏng. Người dùng bấm
 * "Đăng xuất" phải thoát được, không thể rơi vào cảnh báo lỗi rồi kẹt lại. Có test cho việc này:
 * _"không có cookie → vẫn 200 (idempotent)"_.
 *
 * @param {string} [refreshToken]
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 501 khi chưa làm
 */
async function logout(refreshToken) {
  return notImplemented('bai-06');
}

/**
 * **[BÀI 08]** Quên mật khẩu: gửi link đặt lại (60 phút).
 *
 * Các bước: tìm user theo email; **không có user hoặc user bị khoá → `return` im lặng**; còn lại
 * `emailTokensService.issue` với `type = EMAIL_TOKEN_TYPES.RESET_PASSWORD`, `ttlMs =
 * RESET_PASSWORD_TTL_MS`, rồi `emailService.sendResetPasswordEmail({ user, token,
 * expiresInMinutes: RESET_PASSWORD_TTL_MINUTES })`.
 *
 * Giống `resendVerification` ở bài 03: controller luôn trả cùng một thông điệp, kể cả khi không
 * gửi gì — nếu không thì endpoint này thành công cụ dò email.
 *
 * Tài khoản **bị khoá** không nhận link: đặt lại mật khẩu xong cũng không đăng nhập được, gửi
 * link chỉ gây hiểu nhầm.
 *
 * @param {Object} input `{ email }`
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 501 khi chưa làm
 */
async function forgotPassword({ email }) {
  return notImplemented('bai-08');
}

/**
 * **[BÀI 08]** Đặt lại mật khẩu bằng token trong email — hàm duy nhất của bài dùng
 * **transaction**.
 *
 * Các bước:
 * 1. `hashPassword(password)` **trước** khi vào transaction — bcrypt mất ~200ms, đừng giữ
 *    transaction mở trong lúc chờ nó.
 * 2. `await db.runInTransaction(async (session) => { ... })`, bên trong **truyền `{ session }`
 *    xuống MỌI thao tác**:
 *    - `emailTokensService.consume({ token, type: RESET_PASSWORD, session })`; `null` → ném
 *      `AppError` 400 `TOKEN_INVALID`, message `'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã
 *      hết hạn'`;
 *    - `usersService.setPassword(emailToken.userId, passwordHash, { session })`;
 *    - `usersService.markEmailVerified(emailToken.userId, { session })` — bấm được link tức là
 *      chứng minh sở hữu email, nên kích hoạt luôn nếu chưa;
 *    - `sessionsService.revokeAllForUser(emailToken.userId, { session })` — **MỌI** phiên, kể cả
 *      phiên của kẻ đang giữ mật khẩu cũ;
 *    - trả `{ user: <kết quả setPassword>, activatedUser: <kết quả markEmailVerified> }`.
 * 3. **Sau khi** transaction commit: `emailService.sendPasswordChangedEmail({ user })`, và nếu
 *    `activatedUser` khác `null` thì gửi thêm email chào mừng.
 *
 * ⚠️ **Vì sao cần transaction?** Bốn thao tác phải cùng thành công hoặc cùng không. Nếu token đã
 * bị tiêu thụ mà đặt mật khẩu lỗi, người dùng mất luôn link (dùng một lần) **và** vẫn giữ mật
 * khẩu cũ — không có đường thoát ngoài việc xin link mới. Tệ hơn: đặt mật khẩu xong mà thu hồi
 * phiên lỗi thì kẻ tấn công vẫn còn phiên đang hoạt động.
 *
 * ⚠️ **Gửi email SAU khi commit**, không gửi bên trong. `mailer.send` chạy nền và không thể
 * rollback — transaction lỗi thì email báo "mật khẩu đã đổi" vẫn bay đi, làm người dùng hoảng.
 *
 * ⚠️ Thiếu `{ session }` ở một thao tác nào đó thì thao tác ấy nằm **ngoài** transaction và
 * không được rollback. Có test cho đúng tình huống này.
 *
 * @param {Object} input `{ token, password }` đã validate
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 400 TOKEN_INVALID
 */
async function resetPassword({ token, password }) {
  return notImplemented('bai-08');
}

/**
 * **[BÀI 08]** Đổi mật khẩu khi đang đăng nhập: thu hồi mọi phiên **KHÁC**, giữ phiên hiện tại.
 *
 * Các bước:
 * 1. `usersService.findByIdWithPassword(userId)`.
 * 2. Không có `passwordHash` (tài khoản chỉ đăng nhập bằng Google) → 400 `PASSWORD_NOT_SET` với
 *    thông điệp chỉ đường sang "Quên mật khẩu".
 * 3. `verifyPassword(currentPassword, user.passwordHash)` sai → 400 `INVALID_CURRENT_PASSWORD`,
 *    kèm **`details`** `[{ field: 'currentPassword', message: ... }]` để frontend gắn lỗi vào
 *    đúng ô.
 * 4. `hashPassword(newPassword)`, rồi trong `db.runInTransaction`: `setPassword` và
 *    `sessionsService.revokeOthers({ userId, currentSessionId: sessionId, session })`.
 * 5. Sau commit: `emailService.sendPasswordChangedEmail({ user })`.
 *
 * ⚠️ **Sai mật khẩu hiện tại là 400, KHÔNG phải 401.** 401 là tín hiệu "token hỏng" — frontend sẽ
 * đi refresh rồi thử lại, và cuối cùng đăng xuất người dùng chỉ vì họ gõ nhầm mật khẩu cũ. Có
 * test cho việc này ở cả hai phía.
 *
 * ⚠️ Ở đây thu hồi phiên **khác** (không phải mọi phiên): chính chủ đang đổi mật khẩu, không có
 * lý do gì đá họ ra khỏi tab đang dùng. Khác với `resetPassword` — ở đó ta không biết ai đang
 * giữ phiên nào.
 *
 * @param {Object} auth `{ userId, sessionId }` của người đang đăng nhập
 * @param {Object} input `{ currentPassword, newPassword }` đã validate
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 400 PASSWORD_NOT_SET | 400 INVALID_CURRENT_PASSWORD
 */
async function changePassword({ userId, sessionId }, { currentPassword, newPassword }) {
  return notImplemented('bai-08');
}

/**
 * @throws {AppError} 403 FEATURE_DISABLED khi Super Admin tắt magic link
 */
async function assertMagicLinkEnabled() {
  return notImplemented('bai-09');
}

/**
 * **[BÀI 09]** Gửi liên kết đăng nhập không cần mật khẩu (15 phút).
 *
 * Các bước: `await assertMagicLinkEnabled()` **trước tiên**; tìm user theo email; `!user ||
 * user.lockedAt` → `return` im lặng; còn lại `emailTokensService.issue` với
 * `type = EMAIL_TOKEN_TYPES.MAGIC_LINK`, `ttlMs = MAGIC_LINK_TTL_MS`, rồi
 * `emailService.sendMagicLinkEmail({ user, token, expiresInMinutes: MAGIC_LINK_TTL_MINUTES })`.
 *
 * Cùng khuôn với `forgotPassword` (bài 08) — kể cả việc im lặng với email lạ.
 *
 * @param {Object} input `{ email }`
 * @returns {Promise} resolve khi xong
 * @throws {AppError} 403 FEATURE_DISABLED
 */
async function requestMagicLink({ email }) {
  return notImplemented('bai-09');
}

/**
 * **[BÀI 09]** Đăng nhập bằng token trong magic link.
 *
 * Các bước:
 * 1. `await assertMagicLinkEnabled()` — **kiểm cả ở đây**, không chỉ lúc gửi: tắt tính năng thì
 *    link đã gửi đi cũng phải hết hiệu lực ngay.
 * 2. `emailTokensService.consume({ token, type: EMAIL_TOKEN_TYPES.MAGIC_LINK })`; `null` → 400
 *    `TOKEN_INVALID`, message `'Liên kết đăng nhập không hợp lệ hoặc đã hết hạn'`.
 * 3. `const activatedUser = await usersService.activateByEmailProof(emailToken.userId)` — xem
 *    cảnh báo bên dưới. Có `activatedUser` → gửi email chào mừng.
 * 4. `const user = activatedUser ?? (await usersService.findById(emailToken.userId))`.
 * 5. `assertCanSignIn(user)` (bài 04) rồi `return startSession(user, client)`.
 *
 * ⚠️ **Dùng `activateByEmailProof`, KHÔNG dùng `markEmailVerified`.** Khác biệt: hàm này xoá luôn
 * `passwordHash` cũ. Người bấm magic link là **chủ hộp thư**, nhưng mật khẩu đang lưu có thể do
 * một kẻ khác đặt khi đăng ký trước bằng email này (pre-account takeover — bài 03). Giữ lại mật
 * khẩu đó là trao tài khoản cho kẻ gian. `verify-email` ở bài 03 thì ngược lại: link gửi cho
 * chính người vừa đăng ký nên mật khẩu được giữ. Xem `docs/03` §7.
 *
 * @param {Object} input `{ token }`
 * @param {Object} client `{ userAgent, ip }`
 * @returns {Promise} resolve `{ accessToken, refreshToken, user }`
 * @throws {AppError} 403 FEATURE_DISABLED | 400 TOKEN_INVALID | 403 ACCOUNT_LOCKED
 */
async function loginWithMagicLink({ token }, client) {
  return notImplemented('bai-09');
}

/**
 * **[BÀI 10]** Đăng nhập bằng hồ sơ Google đã xác minh — **ba nhánh**, đúng thứ tự.
 *
 * Các bước:
 * 1. `!profile.emailVerified || !profile.email` → ném 400 `OAUTH_EMAIL_NOT_VERIFIED`, message
 *    `'Email Google chưa được xác minh'`. Chỉ tin email mà **Google** xác nhận.
 * 2. `usersService.findByGoogleId(profile.googleId)` — đã liên kết từ trước thì xong.
 * 3. Chưa có: `usersService.findByEmail(profile.email)`.
 *    - **Có** user cùng email → `usersService.linkGoogleAccount(existingUser, profile.googleId)`;
 *      nếu user đó **chưa** kích hoạt thì gửi email chào mừng.
 *    - **Không có** → `await assertRegistrationEnabled()` rồi
 *      `usersService.createGoogleUser(profile)` + email chào mừng.
 * 4. `assertCanSignIn(user)` (bài 04) rồi `return startSession(user, client)`.
 *
 * ⚠️ **Tìm theo `googleId` TRƯỚC, theo email sau.** Người dùng đổi được email trên tài khoản
 * Google của họ; `googleId` (`sub`) thì vĩnh viễn. Tìm theo email trước sẽ làm người đổi email
 * Google bị tạo tài khoản mới thay vì vào tài khoản cũ. Có test cho việc này: _"đã liên kết (tìm
 * theo googleId) → đăng nhập đúng tài khoản dù email Google đã đổi"_.
 *
 * ⚠️ `assertRegistrationEnabled` chỉ chặn nhánh **tạo mới**. Super Admin tắt đăng ký không được
 * chặn người đã có tài khoản đăng nhập.
 *
 * @param {Object} profile `{ googleId, email, emailVerified, name }` từ ID token
 * @param {Object} client `{ userAgent, ip }`
 * @returns {Promise} resolve `{ accessToken, refreshToken, user }`
 * @throws {AppError} OAUTH_EMAIL_NOT_VERIFIED | REGISTRATION_DISABLED | ACCOUNT_LOCKED
 */
async function loginWithGoogle(profile, client) {
  return notImplemented('bai-10');
}

/**
 * Bắt đầu đăng nhập Google: tạo URL + giá trị cần giữ lại (state, codeVerifier) trong cookie tạm.
 * @returns {Promise} resolve `{ url, state, codeVerifier }`
 */
async function startGoogleLogin() {
  return googleOAuth.createAuthorizationRequest();
}

/**
 * Tách cookie tạm `<state>.<codeVerifier>` (codeVerifier có thể chứa dấu chấm → tách ở dấu đầu).
 * @param {string} [cookieValue]
 * @returns {Object|null} `{ state, codeVerifier }`
 */
function parseOAuthState(cookieValue) {
  const separatorIndex = cookieValue?.indexOf('.') ?? -1;
  if (separatorIndex <= 0) return null;
  return {
    state: cookieValue.slice(0, separatorIndex),
    codeVerifier: cookieValue.slice(separatorIndex + 1),
  };
}

/**
 * **[BÀI 10]** Hoàn tất đăng nhập Google khi Google chuyển trình duyệt về callback.
 *
 * Các bước:
 * 1. `googleCallbackQuerySchema.safeParse(query)`. Parse **thành công** và có `error` (người dùng
 *    bấm "Huỷ" ở màn hình Google) → ném 400 `OAUTH_CANCELLED`, message `'Bạn đã huỷ đăng nhập
 *    bằng Google'`.
 * 2. `parseOAuthState(stateCookie)` (đã viết sẵn ngay phía trên) → `{ state, codeVerifier }`.
 * 3. Thiếu cookie, thiếu `code`, hoặc `state` **không khớp** cookie → ném 400
 *    `OAUTH_STATE_INVALID`. So sánh bằng **`safeEqual`**, không dùng `===`.
 * 4. `googleOAuth.exchangeCode({ code, codeVerifier: saved.codeVerifier })` rồi
 *    `return loginWithGoogle(profile, client)`.
 *
 * ⚠️ `safeEqual` so sánh **thời gian không đổi**: `===` thoát ngay ở byte đầu khác nhau, để lộ
 * độ dài tiền tố trùng khớp qua thời gian phản hồi. Với chuỗi bí mật, luôn dùng so sánh
 * timing-safe.
 *
 * @param {Object} params
 * @param {Object} params.query query của callback (`code`, `state` hoặc `error`)
 * @param {string} [params.stateCookie] giá trị cookie tạm
 * @param {Object} client `{ userAgent, ip }`
 * @returns {Promise} resolve `{ accessToken, refreshToken, user }`
 * @throws {AppError} OAUTH_CANCELLED | OAUTH_STATE_INVALID | các lỗi của loginWithGoogle
 * @throws {Error} lỗi khi gọi Google (code sai/hết hạn, ID token sai)
 */
async function completeGoogleLogin({ query, stateCookie }, client) {
  return notImplemented('bai-10');
}

export const authService = {
  startGoogleLogin,
  completeGoogleLogin,
  loginWithGoogle,
  assertRegistrationEnabled,
  requestMagicLink,
  loginWithMagicLink,
  forgotPassword,
  resetPassword,
  changePassword,
  refresh,
  logout,
  register,
  verifyEmail,
  resendVerification,
  login,
  resolveAccessToken,
};
