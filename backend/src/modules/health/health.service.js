import { db } from '../../shared/config/db.js';
import { AppError } from '../../shared/errors/AppError.js';
import { ERROR_CODES } from '../../shared/errors/errorCodes.js';

/**
 * @typedef {Object} HealthStatus
 * @property {string} status luôn là 'ok' khi trả về thành công
 * @property {string} database luôn là 'up' khi trả về thành công
 * @property {number} uptime số giây tiến trình đã chạy
 * @property {string} timestamp thời điểm kiểm tra (ISO 8601)
 */

/**
 * Kiểm tra API và kết nối database.
 * @returns {Promise} resolve HealthStatus
 * @throws {AppError} 503 SERVICE_UNAVAILABLE khi database không phản hồi
 */
async function getHealth() {
  const isDatabaseUp = await db.pingDB();

  if (!isDatabaseUp) {
    throw new AppError({
      statusCode: 503,
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
      message: 'Cơ sở dữ liệu không phản hồi',
    });
  }

  return {
    status: 'ok',
    database: 'up',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

export const healthService = { getHealth };
