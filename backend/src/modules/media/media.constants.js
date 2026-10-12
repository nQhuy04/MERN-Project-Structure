/** Media = ảnh dùng trong hệ thống (avatar, ảnh nội dung...) — tách với file cá nhân (files). */
export const MEDIA_STATUSES = Object.freeze({ PENDING: 'PENDING', READY: 'READY' });

export const MEDIA_IMAGE_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024;

/** Folder đơn cấp: chữ thường, số, gạch ngang. */
export const MEDIA_FOLDER_PATTERN = /^[a-z0-9-]{1,50}$/;

export const AVATAR_FOLDER = 'avatars';

/**
 * Thư mục hệ thống: luôn có, không nằm trong collection media_folders, không tạo / xoá / tải tay
 * được (ảnh vào đây qua luồng riêng, vd. người dùng đổi ảnh đại diện).
 */
export const SYSTEM_FOLDERS = Object.freeze([AVATAR_FOLDER]);

/** Số ảnh mới nhất lấy làm ảnh bìa của thẻ thư mục. */
export const FOLDER_COVER_COUNT = 4;
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

/** Ảnh không được dùng quá khoảng này mới bị coi là mồ côi (tránh xoá ảnh vừa tải, chưa kịp gán). */
export const ORPHAN_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
