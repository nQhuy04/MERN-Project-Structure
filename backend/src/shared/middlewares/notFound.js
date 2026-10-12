import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

/** Route không khớp với bất kỳ router nào → 404 theo định dạng lỗi chuẩn. */
export function notFound(req, _res, next) {
  next(
    new AppError({
      statusCode: 404,
      code: ERROR_CODES.ROUTE_NOT_FOUND,
      message: `Không tìm thấy đường dẫn ${req.method} ${req.originalUrl}`,
    }),
  );
}
