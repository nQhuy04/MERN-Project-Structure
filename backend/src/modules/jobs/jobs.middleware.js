import { env } from '../../shared/config/env.js';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';
import { safeEqual } from '../../shared/utils/token.js';

/**
 * Bảo vệ endpoint kích hoạt job từ ngoài bằng header `X-Jobs-Secret` (so sánh timing-safe).
 * Không cấu hình JOBS_TRIGGER_SECRET → endpoint như không tồn tại (404).
 * Sai secret → 403 (401 dành riêng cho access/refresh token).
 */
export function requireJobsSecret(req, _res, next) {
  if (!env.JOBS_TRIGGER_SECRET) {
    throw new AppError({
      statusCode: 404,
      code: ERROR_CODES.FEATURE_NOT_CONFIGURED,
      message: 'Tính năng này chưa được cấu hình trên máy chủ',
    });
  }
  if (!safeEqual(req.get('x-jobs-secret') ?? '', env.JOBS_TRIGGER_SECRET)) {
    throw new AppError({
      statusCode: 403,
      code: ERROR_CODES.FORBIDDEN,
      message: 'Secret không hợp lệ',
    });
  }
  next();
}
