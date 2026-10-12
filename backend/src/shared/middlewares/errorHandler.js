import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from '../lib/zod.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { logger } from '../lib/logger.js';

const MONGO_DUPLICATE_KEY = 11000;

/**
 * Chuyển mọi loại lỗi về một dạng thống nhất. Lỗi không nhận diện được → 500
 * với thông điệp chung, không lộ chi tiết nội bộ cho client.
 * @param {Error} err
 * @returns {Object} `{ statusCode, code, message, details }` — `details` có thể không có
 */
function normalizeError(err) {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    };
  }

  if (err instanceof z.ZodError) {
    return {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Dữ liệu không hợp lệ',
      details: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    };
  }

  // TokenExpiredError kế thừa JsonWebTokenError → kiểm tra trước.
  if (err instanceof jwt.TokenExpiredError) {
    return {
      statusCode: 401,
      code: ERROR_CODES.AUTH_TOKEN_EXPIRED,
      message: 'Phiên đăng nhập đã hết hạn',
    };
  }
  if (err instanceof jwt.JsonWebTokenError) {
    return {
      statusCode: 401,
      code: ERROR_CODES.AUTH_TOKEN_INVALID,
      message: 'Phiên đăng nhập không hợp lệ',
    };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Dữ liệu không hợp lệ',
      details: Object.values(err.errors).map((item) => ({
        field: item.path,
        message: item.message,
      })),
    };
  }

  if (err instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Dữ liệu không hợp lệ',
      details: [{ field: err.path, message: 'Giá trị không đúng định dạng' }],
    };
  }

  if (err.code === MONGO_DUPLICATE_KEY) {
    return {
      statusCode: 409,
      code: ERROR_CODES.DUPLICATE_VALUE,
      message: 'Dữ liệu đã tồn tại',
      details: Object.keys(err.keyValue ?? {}).map((field) => ({
        field,
        message: 'Giá trị này đã được sử dụng',
      })),
    };
  }

  if (err instanceof mongoose.Error.DocumentNotFoundError) {
    return {
      statusCode: 404,
      code: ERROR_CODES.RESOURCE_NOT_FOUND,
      message: 'Không tìm thấy dữ liệu',
    };
  }

  // Lỗi do express.json() ném ra.
  if (err.type === 'entity.parse.failed') {
    return {
      statusCode: 400,
      code: ERROR_CODES.INVALID_JSON,
      message: 'Body không phải JSON hợp lệ',
    };
  }
  if (err.type === 'entity.too.large') {
    return {
      statusCode: 413,
      code: ERROR_CODES.PAYLOAD_TOO_LARGE,
      message: 'Dữ liệu gửi lên quá lớn',
    };
  }

  return {
    statusCode: 500,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: 'Đã có lỗi xảy ra, vui lòng thử lại sau',
  };
}

/**
 * Error handler tập trung duy nhất của ứng dụng (gắn cuối cùng trong app.js).
 * Express nhận diện error middleware qua đủ 4 tham số.
 */
export function errorHandler(err, req, res, next) {
  // Response đã gửi dở (vd. đang stream) → để Express đóng kết nối.
  if (res.headersSent) return next(err);

  const { statusCode, code, message, details } = normalizeError(err);

  if (statusCode >= 500) {
    logger.error({ err, method: req.method, url: req.originalUrl }, 'Lỗi không xử lý được');
  }

  res.status(statusCode).json({
    success: false,
    error: { code, message, ...(details?.length && { details }) },
  });
}
