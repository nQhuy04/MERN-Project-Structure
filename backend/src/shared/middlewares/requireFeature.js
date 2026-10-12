import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

/**
 * Chặn route của dịch vụ tuỳ chọn chưa cấu hình (thiếu biến môi trường) → 404 như route không
 * tồn tại. Kiểm tra lúc có request, không phải lúc nạp module.
 * @param {Function} isEnabled hàm trả về true nếu tính năng đang bật
 * @returns {Function} Express middleware
 */
export function requireFeature(isEnabled) {
  return (_req, _res, next) => {
    if (!isEnabled()) {
      throw new AppError({
        statusCode: 404,
        code: ERROR_CODES.FEATURE_NOT_CONFIGURED,
        message: 'Tính năng này chưa được cấu hình trên máy chủ',
      });
    }
    next();
  };
}
