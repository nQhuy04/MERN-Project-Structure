/**
 * Kiểu dữ liệu chung của response API (chỉ để tài liệu hoá, JSDoc thuần).
 */

/**
 * @typedef {Object} ErrorDetail
 * @property {string} field tên trường bị lỗi, khớp với tên ô trong form
 * @property {string} message thông điệp tiếng Việt
 */

/**
 * @typedef {Object} ApiSuccessResponse
 * @property {boolean} success luôn là true
 * @property {string} [message]
 * @property {*} data
 */

/**
 * @typedef {Object} ApiErrorResponse
 * @property {boolean} success luôn là false
 * @property {Object} error
 * @property {string} error.code mã trong ERROR_CODES
 * @property {string} error.message
 * @property {ErrorDetail[]} [error.details]
 */

export {};
