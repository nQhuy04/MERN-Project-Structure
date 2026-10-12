import mongoose from 'mongoose';
import { USER_NAME_MAX_LENGTH, USER_ROLES } from './users.constants.js';

// Giữ export cho code/test đã dùng từ model.
export { USER_ROLES };

// Độ dài tối đa của một địa chỉ email theo RFC 5321.
const EMAIL_MAX_LENGTH = 254;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      trim: true,
      lowercase: true,
      maxlength: [EMAIL_MAX_LENGTH, 'Email quá dài'],
    },
    name: {
      type: String,
      required: [true, 'Tên là bắt buộc'],
      trim: true,
      maxlength: [USER_NAME_MAX_LENGTH, `Tên tối đa ${USER_NAME_MAX_LENGTH} ký tự`],
    },
    // Không bắt buộc: tài khoản tạo qua Google chưa có mật khẩu.
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: { values: Object.values(USER_ROLES), message: 'Vai trò không hợp lệ' },
      default: USER_ROLES.MEMBER,
    },
    // null = chưa kích hoạt. Trạng thái user suy ra từ emailVerifiedAt + lockedAt,
    // không lưu trường "status" riêng để tránh hai nguồn sự thật.
    emailVerifiedAt: { type: Date, default: null },
    lockedAt: { type: Date, default: null },
    // Không đặt default: index unique chỉ áp dụng khi googleId là chuỗi (partial index).
    googleId: { type: String, select: false },
    avatarMediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { collection: 'users', timestamps: true },
);

// Index được TẠO bằng migration (migrations/*-create-users-indexes.js); khai báo lại ở đây
// với cùng tên để người đọc model thấy; tests/migrations.test.js bắt lệch tên/option giữa hai nơi.
userSchema.index({ email: 1 }, { name: 'email_unique', unique: true });
userSchema.index(
  { googleId: 1 },
  {
    name: 'googleId_unique',
    unique: true,
    partialFilterExpression: { googleId: { $type: 'string' } },
  },
);
// Danh sách user cho quản trị: sắp xếp theo ngày tạo, lọc theo role.
userSchema.index({ createdAt: -1 }, { name: 'createdAt_desc' });
userSchema.index({ role: 1, createdAt: -1 }, { name: 'role_createdAt' });
// Resolver "nơi dùng" của media: user nào đang dùng ảnh làm avatar.
userSchema.index(
  { avatarMediaId: 1 },
  { name: 'avatarMediaId', partialFilterExpression: { avatarMediaId: { $type: 'objectId' } } },
);
// Ràng buộc "luôn đúng 1 Super Admin" ở tầng DB, không chỉ ở code.
userSchema.index(
  { role: 1 },
  {
    name: 'role_single_super_admin',
    unique: true,
    partialFilterExpression: { role: USER_ROLES.SUPER_ADMIN },
  },
);

export const User = mongoose.model('User', userSchema);
