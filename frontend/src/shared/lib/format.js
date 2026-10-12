const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

/**
 * Định dạng thời điểm theo kiểu Việt Nam, vd. "14:30 28/9/2026".
 * @param {string|Date|null} value chuỗi ISO từ API hoặc Date
 * @returns {string} chuỗi rỗng nếu không có giá trị
 */
export function formatDateTime(value) {
  if (!value) return '';
  return dateTimeFormatter.format(new Date(value));
}

/**
 * Định dạng dung lượng file, vd. 1536 → "1,5 KB".
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} ${units[unitIndex]}`;
}
