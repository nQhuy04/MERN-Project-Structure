import { describe, expect, it } from 'vitest';
import { buildEnv } from '../../src/shared/config/env.js';

const VALID_SOURCE = {
  MONGODB_URI: 'mongodb://localhost:27017/app',
  CORS_ORIGINS: 'http://localhost:5173',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
};

// Production bắt buộc thêm URL frontend và cấu hình gửi email thật.
const PRODUCTION_SOURCE = {
  ...VALID_SOURCE,
  NODE_ENV: 'production',
  APP_URL: 'https://app.example.com',
  RESEND_API_KEY: 're_test',
  EMAIL_FROM: 'App <no-reply@example.com>',
};

describe('[bai-01] buildEnv — validate biến môi trường lúc khởi động', () => {
  it('mặc định ở development: TRUST_PROXY=0, LOG_LEVEL=debug, email in ra console', () => {
    const env = buildEnv({ ...VALID_SOURCE, NODE_ENV: 'development' });

    expect(env).toMatchObject({
      PORT: 4000,
      TRUST_PROXY: 0,
      LOG_LEVEL: 'debug',
      IS_PRODUCTION: false,
      APP_URL: 'http://localhost:5173',
      EMAIL_DELIVERY: 'console',
      RATE_LIMIT_ENABLED: true,
    });
  });

  it('mặc định ở production: TRUST_PROXY=1, LOG_LEVEL=info, gửi email qua Resend', () => {
    const env = buildEnv(PRODUCTION_SOURCE);

    expect(env).toMatchObject({
      TRUST_PROXY: 1,
      LOG_LEVEL: 'info',
      IS_PRODUCTION: true,
      EMAIL_DELIVERY: 'resend',
    });
  });

  it('production thiếu APP_URL / kênh gửi email thật → lỗi liệt kê đủ biến', () => {
    expect(() => buildEnv({ ...VALID_SOURCE, NODE_ENV: 'production' })).toThrow(
      /APP_URL[\s\S]*RESEND_API_KEY: Bắt buộc ở production \(hoặc cấu hình nhóm SMTP_\*/,
    );
  });

  it('chọn EMAIL_DELIVERY=resend ở development cũng bắt buộc cấu hình Resend', () => {
    expect(() => buildEnv({ ...VALID_SOURCE, EMAIL_DELIVERY: 'resend' })).toThrow(/RESEND_API_KEY/);
  });

  it('có RESEND_API_KEY mà thiếu EMAIL_FROM → lỗi (Resend chỉ gửi từ domain đã xác minh)', () => {
    expect(() => buildEnv({ ...VALID_SOURCE, RESEND_API_KEY: 're_test' })).toThrow(/EMAIL_FROM/);
  });

  describe('SMTP', () => {
    const smtp = { SMTP_HOST: 'smtp.gmail.com', SMTP_USER: 'an@gmail.com', SMTP_PASS: 'app-pass' };

    it('đủ HOST/USER/PASS → bật; mặc định cổng 587 (STARTTLS), người gửi là SMTP_USER', () => {
      expect(buildEnv({ ...VALID_SOURCE, ...smtp })).toMatchObject({
        SMTP_ENABLED: true,
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        EMAIL_FROM: 'MERN Base <an@gmail.com>',
        EMAIL_DELIVERY: 'console',
      });
      expect(buildEnv(VALID_SOURCE).SMTP_ENABLED).toBe(false);
    });

    it('cổng 465 → mặc định TLS ngay từ đầu; SMTP_SECURE đặt rõ thì ghi đè', () => {
      expect(buildEnv({ ...VALID_SOURCE, ...smtp, SMTP_PORT: '465' }).SMTP_SECURE).toBe(true);
      expect(
        buildEnv({ ...VALID_SOURCE, ...smtp, SMTP_PORT: '465', SMTP_SECURE: 'false' }).SMTP_SECURE,
      ).toBe(false);
    });

    it('thiếu một biến trong nhóm → lỗi, báo đúng biến thiếu (không báo trùng)', () => {
      expect(() => buildEnv({ ...VALID_SOURCE, SMTP_HOST: 'smtp.gmail.com' })).toThrow(
        /SMTP_USER: SMTP cần đủ cả 3 biến[\s\S]*SMTP_PASS: SMTP cần đủ cả 3 biến/,
      );
    });

    it('EMAIL_DELIVERY=smtp mà trống cả nhóm → lỗi', () => {
      expect(() => buildEnv({ ...VALID_SOURCE, EMAIL_DELIVERY: 'smtp' })).toThrow(
        /SMTP_HOST: Bắt buộc khi EMAIL_DELIVERY=smtp/,
      );
    });

    it('production chỉ cấu hình SMTP (chưa có domain cho Resend) → kênh mặc định là smtp', () => {
      const env = buildEnv({
        ...VALID_SOURCE,
        ...smtp,
        NODE_ENV: 'production',
        APP_URL: 'https://app.example.com',
      });

      expect(env.EMAIL_DELIVERY).toBe('smtp');
    });
  });

  it('biến để trống (KEY=) được coi như chưa đặt → dùng mặc định', () => {
    const env = buildEnv({ ...PRODUCTION_SOURCE, TRUST_PROXY: '', LOG_LEVEL: '' });

    expect(env).toMatchObject({ TRUST_PROXY: 1, LOG_LEVEL: 'info' });
  });

  it('giá trị đặt rõ ghi đè mặc định; RATE_LIMIT_ENABLED nhận chuỗi true/false', () => {
    const env = buildEnv({ ...PRODUCTION_SOURCE, TRUST_PROXY: '2', RATE_LIMIT_ENABLED: 'false' });

    expect(env).toMatchObject({ TRUST_PROXY: 2, RATE_LIMIT_ENABLED: false });
  });

  it('cookie: mặc định SameSite=lax, Secure bật ở production, tắt ở development', () => {
    expect(buildEnv(VALID_SOURCE)).toMatchObject({ COOKIE_SAME_SITE: 'lax', COOKIE_SECURE: false });
    expect(buildEnv(PRODUCTION_SOURCE)).toMatchObject({ COOKIE_SECURE: true });
  });

  it('SameSite=none mà tắt Secure → lỗi; không đặt Secure thì tự bật', () => {
    expect(() =>
      buildEnv({ ...VALID_SOURCE, COOKIE_SAME_SITE: 'none', COOKIE_SECURE: 'false' }),
    ).toThrow(/COOKIE_SECURE/);
    expect(buildEnv({ ...VALID_SOURCE, COOKIE_SAME_SITE: 'none' }).COOKIE_SECURE).toBe(true);
  });

  it('Google OAuth: đủ 3 biến → bật; trống cả 3 → tắt; thiếu 1 → lỗi', () => {
    const google = {
      GOOGLE_CLIENT_ID: 'id',
      GOOGLE_CLIENT_SECRET: 'secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:4000/api/v1/auth/google/callback',
    };

    expect(buildEnv({ ...VALID_SOURCE, ...google }).GOOGLE_OAUTH_ENABLED).toBe(true);
    expect(buildEnv(VALID_SOURCE).GOOGLE_OAUTH_ENABLED).toBe(false);
    expect(() => buildEnv({ ...VALID_SOURCE, GOOGLE_CLIENT_ID: 'id' })).toThrow(
      /GOOGLE_CLIENT_SECRET[\s\S]*GOOGLE_REDIRECT_URI/,
    );
  });

  it('JWT_ACCESS_SECRET ngắn hơn 32 ký tự → lỗi', () => {
    expect(() => buildEnv({ ...VALID_SOURCE, JWT_ACCESS_SECRET: 'ngan' })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('APP_URL bỏ dấu "/" cuối để ghép đường dẫn', () => {
    const env = buildEnv({ ...VALID_SOURCE, APP_URL: 'https://app.example.com/' });

    expect(env.APP_URL).toBe('https://app.example.com');
  });

  it('tách CORS_ORIGINS thành mảng, bỏ khoảng trắng', () => {
    const env = buildEnv({
      ...VALID_SOURCE,
      CORS_ORIGINS: 'http://localhost:5173 , https://app.example.com',
    });

    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173', 'https://app.example.com']);
  });

  it('thiếu hoặc sai biến → ném lỗi liệt kê đủ tên biến (fail fast)', () => {
    expect(() => buildEnv({ MONGODB_URI: 'http://sai', CORS_ORIGINS: 'khong-phai-url' })).toThrow(
      /MONGODB_URI[\s\S]*CORS_ORIGINS/,
    );
  });

  it('kết quả chỉ đọc', () => {
    const env = buildEnv(VALID_SOURCE);

    expect(Object.isFrozen(env)).toBe(true);
  });
});
