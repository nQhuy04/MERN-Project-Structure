import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

/**
 * Chống CSRF cho route dùng cookie (refresh, logout): bắt buộc header
 * `X-Requested-With: XMLHttpRequest`. Form HTML hay thẻ <img> ở site khác không đặt được header
 * tuỳ ý; request fetch/XHR từ site khác muốn đặt header thì phải qua preflight CORS — bị chặn vì
 * origin không nằm trong whitelist.
 */
export function requireXhr(req, _res, next) {
  if (req.get('x-requested-with') !== 'XMLHttpRequest') {
    throw new AppError({
      statusCode: 403,
      code: ERROR_CODES.CSRF_REJECTED,
      message: 'Yêu cầu không hợp lệ',
    });
  }
  next();
}
