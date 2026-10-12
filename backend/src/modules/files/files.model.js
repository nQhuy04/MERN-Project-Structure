import mongoose from 'mongoose';
import { ALLOWED_FILE_TYPES, FILE_STATUSES } from './files.constants.js';

/** File cá nhân của người dùng; nội dung nằm trên R2 (key), DB chỉ lưu thông tin. */
const fileSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Server tự sinh `users/<ownerId>/<uuid>` — không dùng tên file người dùng (tránh ghi đè, lộ tên).
    key: { type: String, required: true },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    contentType: { type: String, required: true, enum: ALLOWED_FILE_TYPES },
    size: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(FILE_STATUSES),
      default: FILE_STATUSES.PENDING,
    },
  },
  { collection: 'files', timestamps: true },
);

// Index tạo bằng migration (*-create-files-indexes.js), khai báo lại cùng tên.
fileSchema.index({ key: 1 }, { name: 'key_unique', unique: true });
fileSchema.index({ ownerId: 1, status: 1, createdAt: -1 }, { name: 'ownerId_status_createdAt' });
// Job dọn upload dở: tìm PENDING cũ.
fileSchema.index({ status: 1, createdAt: 1 }, { name: 'status_createdAt' });

export const File = mongoose.model('File', fileSchema);
