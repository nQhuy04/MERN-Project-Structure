import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Logger dùng chung. Development in dạng dễ đọc (pino-pretty), production in JSON
 * một dòng để nền tảng deploy thu thập. Không dùng console.log trong code ứng dụng.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  ...(env.IS_DEVELOPMENT && {
    transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } },
  }),
});
