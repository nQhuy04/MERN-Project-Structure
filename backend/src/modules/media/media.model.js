import mongoose from 'mongoose';
import { MEDIA_FOLDER_PATTERN, MEDIA_IMAGE_TYPES, MEDIA_STATUSES } from './media.constants.js';

const mediaSchema = new mongoose.Schema(
  {
    folder: { type: String, required: true, match: MEDIA_FOLDER_PATTERN },
    // Server sinh `media/<folder>/<uuid>`.
    key: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 255 },
    contentType: { type: String, required: true, enum: MEDIA_IMAGE_TYPES },
    size: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(MEDIA_STATUSES),
      default: MEDIA_STATUSES.PENDING,
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { collection: 'media', timestamps: true },
);

// Index tạo bằng migration (*-create-media-indexes.js), khai báo lại cùng tên.
mediaSchema.index({ key: 1 }, { name: 'key_unique', unique: true });
mediaSchema.index({ folder: 1, createdAt: -1 }, { name: 'folder_createdAt' });
mediaSchema.index({ status: 1, createdAt: 1 }, { name: 'status_createdAt' });

export const Media = mongoose.model('Media', mediaSchema);
