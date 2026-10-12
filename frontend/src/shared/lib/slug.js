/**
 * Chuyển chữ tự do (có dấu tiếng Việt, khoảng trắng) thành slug `[a-z0-9-]`:
 * "Sự kiện 2026" → "su-kien-2026". Giữ gạch ngang ở cuối để gõ tiếp được; bỏ nó bằng
 * `trimSlug` trước khi gửi.
 * @param {string} text
 * @returns {string}
 */
export function toSlug(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '');
}

/**
 * Bỏ gạch ngang thừa ở đầu / cuối slug.
 * @param {string} slug
 * @returns {string}
 */
export function trimSlug(slug) {
  return slug.replace(/^-+|-+$/g, '');
}
