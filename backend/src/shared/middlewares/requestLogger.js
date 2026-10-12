import { logger } from '../lib/logger.js';

const NANOSECONDS_PER_MILLISECOND = 1_000_000n;

/**
 * Chọn mức log theo status: lỗi server → error, lỗi client → warn, còn lại → info.
 * @param {number} statusCode
 * @returns {string}
 */
function getLogLevel(statusCode) {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
}

/**
 * Ghi một dòng log cho mỗi request khi response kết thúc: method, path, status, thời gian xử lý.
 * Không ghi body, header, query string để tránh lộ mật khẩu, token (vd. `?code=` của OAuth).
 */
export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number((process.hrtime.bigint() - startedAt) / NANOSECONDS_PER_MILLISECOND);
    logger[getLogLevel(res.statusCode)](
      {
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        durationMs,
      },
      'request',
    );
  });

  next();
}
