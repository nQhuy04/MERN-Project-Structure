// db.js phải được import trước app.js: nó cấu hình mongoose toàn cục trước khi model được định nghĩa.
import { db } from './shared/config/db.js';
import { env } from './shared/config/env.js';
import { logger } from './shared/lib/logger.js';
import { mailer } from './shared/lib/mailer.js';
import { app } from './app.js';
import { jobsRunner } from './modules/jobs/jobs.runner.js';

const FORCE_SHUTDOWN_TIMEOUT_MS = 10_000;

/** Lỗi không được bắt → log rồi thoát, để nền tảng deploy khởi động lại tiến trình sạch. */
function exitOnFatal(label) {
  return (err) => {
    logger.fatal({ err }, label);
    process.exit(1);
  };
}

function registerShutdown(server) {
  let isShuttingDown = false;

  const shutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal }, 'Đang tắt server...');

    // Quá hạn mà vẫn còn kết nối treo thì buộc thoát.
    setTimeout(() => process.exit(1), FORCE_SHUTDOWN_TIMEOUT_MS).unref();

    server.close(async () => {
      // Dừng quét job (chờ lượt đang chạy xong) và chờ email gửi nền, rồi mới ngắt DB.
      await jobsRunner.stop();
      await mailer.waitForPending();
      await db.disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function start() {
  await db.connectDB();

  const server = app.listen(env.PORT, (error) => {
    if (error) return exitOnFatal('Không mở được cổng')(error);
    logger.info(`API chạy tại http://localhost:${env.PORT}/api/v1`);
    if (env.JOBS_RUNNER_ENABLED) jobsRunner.start();
  });

  registerShutdown(server);
}

process.on('unhandledRejection', exitOnFatal('unhandledRejection'));
process.on('uncaughtException', exitOnFatal('uncaughtException'));

start().catch(exitOnFatal('Không khởi động được server'));
