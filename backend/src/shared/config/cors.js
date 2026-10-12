import { env } from './env.js';

/**
 * CORS theo whitelist trong env, cho phép gửi cookie (refresh token).
 * Request không có Origin (curl, server-to-server) không bị CORS chặn — việc
 * chặn CSRF dựa vào header X-Requested-With ở các route nhạy cảm.
 */
export const corsOptions = {
  origin: env.CORS_ORIGINS,
  credentials: true,
};
