import mongoose from 'mongoose';

export const EMAIL_TOKEN_TYPES = Object.freeze({
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  RESET_PASSWORD: 'RESET_PASSWORD',
  MAGIC_LINK: 'MAGIC_LINK',
});

/** Token gửi qua email: chỉ lưu hash, có hạn, dùng 1 lần. */
const emailTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(EMAIL_TOKEN_TYPES), required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { collection: 'email_tokens', timestamps: { createdAt: true, updatedAt: false } },
);

// Index tạo bằng migration (*-create-email-tokens-indexes.js), khai báo lại cùng tên.
emailTokenSchema.index({ tokenHash: 1 }, { name: 'tokenHash_unique', unique: true });
emailTokenSchema.index({ userId: 1, type: 1 }, { name: 'userId_type' });
// TTL chỉ để dọn rác (chạy ~60 giây/lần); code vẫn luôn kiểm tra expiresAt khi truy vấn.
emailTokenSchema.index({ expiresAt: 1 }, { name: 'expiresAt_ttl', expireAfterSeconds: 0 });

export const EmailToken = mongoose.model('EmailToken', emailTokenSchema);
