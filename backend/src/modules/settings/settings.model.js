import mongoose from 'mongoose';

/**
 * Một dòng cấu hình hệ thống dạng key–value. Danh sách key, kiểu dữ liệu, giá trị mặc định khai
 * báo trong settings.registry.js — collection này chỉ lưu giá trị đã được Super Admin thay đổi.
 */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { collection: 'settings', timestamps: true },
);

// Index tạo bằng migration (*-create-settings-indexes.js), khai báo lại cùng tên.
settingSchema.index({ key: 1 }, { name: 'key_unique', unique: true });

export const Setting = mongoose.model('Setting', settingSchema);
