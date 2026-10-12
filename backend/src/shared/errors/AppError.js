/**
 * @typedef {Object} ErrorDetail
 * @property {string} field tên trường bị lỗi (vd. "email", "items.0.qty")
 * @property {string} message thông điệp tiếng Việt cho trường đó
 */

/**
 * Lỗi nghiệp vụ có chủ đích. Service ném AppError, errorHandler chuyển thành
 * response lỗi chuẩn. Dùng class để giữ stack trace và kiểm tra bằng `instanceof`.
 */
export class AppError extends Error {
  /**
   * @param {Object} options
   * @param {number} options.statusCode HTTP status (4xx/5xx)
   * @param {string} options.code mã trong ERROR_CODES
   * @param {string} options.message thông điệp tiếng Việt cho người dùng
   * @param {ErrorDetail[]} [options.details] lỗi theo từng trường
   */
  constructor({ statusCode, code, message, details }) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
