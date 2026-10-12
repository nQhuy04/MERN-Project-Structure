import mongoose from 'mongoose';
import { MEDIA_FOLDER_PATTERN } from './media.constants.js';

/**
 * Thư mục của thư viện ảnh do quản trị viên tạo — cho phép thư mục RỖNG tồn tại (tạo trước, tải
 * ảnh sau). Ảnh vẫn lưu tên thư mục ở `media.folder`; thư mục hệ thống (`avatars`) không nằm ở đây.
 */
const mediaFolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, match: MEDIA_FOLDER_PATTERN },
    // null với thư mục được migration tạo bù từ ảnh có sẵn.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { collection: 'media_folders', timestamps: true },
);

// Index tạo bằng migration (*-create-media-folders.js), khai báo lại cùng tên.
mediaFolderSchema.index({ name: 1 }, { name: 'name_unique', unique: true });

export const MediaFolder = mongoose.model('MediaFolder', mediaFolderSchema);
