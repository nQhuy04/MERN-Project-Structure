/** Trạng thái upload: PENDING = đã xin URL nhưng chưa xác nhận xong (job dọn sau). */
export const FILE_STATUSES = Object.freeze({ PENDING: 'PENDING', READY: 'READY' });

/** Whitelist loại file cá nhân được phép tải lên. */
export const ALLOWED_FILE_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Quota kho lưu trữ theo user: chặn một tài khoản tự tạo chiếm hết dung lượng bucket (chi phí R2).
 * Đếm cả bản ghi PENDING — nếu không, chỉ cần xin URL liên tục là vượt quota mà không bị tính.
 */
export const MAX_TOTAL_SIZE_BYTES_PER_USER = 200 * 1024 * 1024;
export const MAX_FILES_PER_USER = 100;
