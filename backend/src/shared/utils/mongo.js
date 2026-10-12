/**
 * Kết quả `.lean()` là object thuần, KHÔNG đi qua `toJSON` toàn cục → vẫn còn `_id`, `__v`.
 * Mọi endpoint dùng `.lean()` phải đưa kết quả qua hàm này để API luôn trả `id`.
 */

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Chuẩn hoá document lean (kể cả subdocument, mảng, dữ liệu populate): `_id` → `id` (string),
 * bỏ `__v`. Giá trị không phải object thuần (Date, ObjectId...) giữ nguyên.
 * @param {*} value document lean, mảng document, hoặc giá trị bất kỳ
 * @returns {*} bản sao đã chuẩn hoá
 */
export function mapLeanDocument(value) {
  if (Array.isArray(value)) return value.map(mapLeanDocument);
  if (!isPlainObject(value)) return value;

  const result = {};
  for (const [key, field] of Object.entries(value)) {
    if (key === '__v') continue;
    if (key === '_id') {
      result.id = String(field);
      continue;
    }
    result[key] = mapLeanDocument(field);
  }
  return result;
}
