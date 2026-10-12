/**
 * Escape ký tự đặc biệt để dùng chuỗi người dùng nhập làm regex tìm kiếm "chứa chuỗi". Không
 * escape → người dùng nhập `.*` khớp mọi thứ, hoặc mẫu gây ReDoS làm treo truy vấn.
 * @param {string} value
 * @returns {string}
 */
export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
