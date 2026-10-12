import mongoose from 'mongoose';

export const USER_AGENT_MAX_LENGTH = 512;

/**
 * Phiên đăng nhập (một thiết bị/trình duyệt). Refresh token có dạng `<sessionId>.<secret>`;
 * DB chỉ lưu hash của secret. Xoá document = thu hồi phiên (access token hết hiệu lực ngay ở
 * request kế tiếp vì `authenticate` kiểm tra session trong DB).
 */
const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    secretHash: { type: String, required: true, select: false },
    // Secret ngay trước lần rotate gần nhất — chấp nhận thêm 30 giây cho request song song.
    previousSecretHash: { type: String, default: null, select: false },
    rotatedAt: { type: Date, default: null },
    userAgent: { type: String, default: '', maxlength: USER_AGENT_MAX_LENGTH },
    ip: { type: String, default: '' },
    lastUsedAt: { type: Date, required: true },
    // Trượt: mỗi lần refresh gia hạn thêm 30 ngày.
    expiresAt: { type: Date, required: true },
  },
  { collection: 'sessions', timestamps: { createdAt: true, updatedAt: false } },
);

// Index tạo bằng migration (*-create-sessions-indexes.js), khai báo lại cùng tên.
sessionSchema.index({ userId: 1 }, { name: 'userId' });
// TTL chỉ để dọn rác; code vẫn kiểm tra expiresAt khi truy vấn.
sessionSchema.index({ expiresAt: 1 }, { name: 'expiresAt_ttl', expireAfterSeconds: 0 });

export const Session = mongoose.model('Session', sessionSchema);
