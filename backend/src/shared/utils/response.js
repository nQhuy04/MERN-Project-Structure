/**
 * Helper trả response thành công theo định dạng chuẩn:
 * `{ success: true, message?, data }`. Lỗi không đi qua đây mà qua errorHandler.
 */

/**
 * @param {Object} res Express response
 * @param {*} data
 * @param {string} [message]
 * @param {number} [statusCode=200]
 * @returns {Object} Express response
 */
export function sendSuccess(res, data, message, statusCode = 200) {
  return res.status(statusCode).json({ success: true, ...(message && { message }), data });
}

/**
 * Trả 201 sau khi tạo tài nguyên.
 * @param {Object} res Express response
 * @param {*} data
 * @param {string} [message]
 * @returns {Object} Express response
 */
export function sendCreated(res, data, message) {
  return sendSuccess(res, data, message, 201);
}

/**
 * Trả danh sách có phân trang: `{ success: true, data: [...], meta: { page, limit, total, totalPages } }`.
 * @param {Object} res Express response
 * @param {Array} items
 * @param {Object} meta kết quả của buildPaginationMeta
 * @returns {Object} Express response
 */
export function sendPaginated(res, items, meta) {
  return res.status(200).json({ success: true, data: items, meta });
}
