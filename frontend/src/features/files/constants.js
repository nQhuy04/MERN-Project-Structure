/** Khớp backend (modules/files/files.constants.js) — kiểm tra sớm để báo lỗi ngay khi chọn file. */
export const ALLOWED_FILE_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
