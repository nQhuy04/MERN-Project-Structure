/** Khớp backend (modules/media/media.constants.js, media.schema.js). */
export const MEDIA_IMAGE_TYPES = Object.freeze({
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
});

export const MAX_MEDIA_SIZE_BYTES = 10 * 1024 * 1024;
export const MEDIA_FOLDER_PATTERN = /^[a-z0-9-]{1,50}$/;
export const MEDIA_FOLDER_MAX_LENGTH = 50;

export const MEDIA_SORT_LABELS = Object.freeze({
  '-createdAt': 'Mới tải trước',
  createdAt: 'Cũ trước',
  name: 'Tên A → Z',
  '-size': 'Dung lượng lớn trước',
});

export const MEDIA_USAGE_OPTIONS = Object.freeze([
  { value: '', label: 'Tất cả' },
  { value: 'in-use', label: 'Đang dùng' },
  { value: 'orphan', label: 'Mồ côi' },
]);

/** Bộ lọc trên URL của trang thư mục / "Tất cả ảnh" (thư mục lấy từ đường dẫn). */
export const MEDIA_LIST_DEFAULTS = Object.freeze({
  q: '',
  type: '',
  usage: '',
  sort: '-createdAt',
  page: 1,
});
