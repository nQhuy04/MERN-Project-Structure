import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Một replica set in-memory cho cả lần chạy (hỗ trợ transaction), mỗi file test một database riêng.
    globalSetup: ['./tests/globalSetup.js'],
    setupFiles: ['./tests/setup.js'],
    env: {
      CORS_ORIGINS: 'http://localhost:5173',
      // Mức thấp nhất cho phép → test hash mật khẩu nhanh hơn.
      BCRYPT_COST: '10',
      // Rate limit được test riêng (tests/shared/rateLimit.test.js); tắt để test luồng không bị chặn.
      RATE_LIMIT_ENABLED: 'false',
      JWT_ACCESS_SECRET: 'test-secret-chi-dung-cho-test-khong-dung-that-0123456789',
      // Bật dịch vụ tuỳ chọn bằng giá trị giả — thư viện gọi Google/R2 được mock trong test.
      GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:4000/api/v1/auth/google/callback',
      R2_ACCOUNT_ID: 'test-account',
      R2_ACCESS_KEY_ID: 'test-access-key',
      R2_SECRET_ACCESS_KEY: 'test-secret-key',
      R2_BUCKET: 'test-bucket',
      // SMTP giả: kênh `smtp` chọn được ở trang Cấu hình; nodemailer được mock trong test.
      // Resend để trống → kiểm tra được trường hợp kênh chưa cấu hình.
      SMTP_HOST: 'smtp.test.local',
      SMTP_USER: 'mailer@test.local',
      SMTP_PASS: 'test-smtp-pass',
      // Test gọi bộ chạy job trực tiếp, không để timer chạy nền.
      JOBS_RUNNER_ENABLED: 'false',
      JOBS_TRIGGER_SECRET: 'test-jobs-secret-chi-dung-cho-test-0123456789',
    },
    // Khởi động mongod lần đầu có thể chậm (tải binary).
    hookTimeout: 60_000,
  },
});
