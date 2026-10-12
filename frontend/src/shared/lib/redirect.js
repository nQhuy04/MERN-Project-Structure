/**
 * Lấy đường dẫn quay lại sau đăng nhập từ `?redirect=` một cách an toàn: chỉ nhận đường dẫn nội
 * bộ bắt đầu bằng "/" (chặn open redirect sang site khác như `//evil.com`, `https://...`).
 * @param {string|null} value giá trị lấy từ URL
 * @param {string} fallback đường dẫn mặc định
 * @returns {string}
 */
export function getSafeRedirect(value, fallback) {
  const isInternalPath = typeof value === 'string' && /^\/(?![/\\])/.test(value);
  return isInternalPath ? value : fallback;
}
