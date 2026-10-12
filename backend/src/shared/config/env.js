import { existsSync } from 'node:fs';
import { z } from '../lib/zod.js';

const ENV_FILE = new URL('../../../.env', import.meta.url);

// Test tự cấp biến môi trường (xem tests/setup.js), không đọc .env của máy dev.
if (process.env.NODE_ENV !== 'test' && existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE);
}

const httpUrlSchema = z.url({ protocol: /^https?$/ });

/** Chuỗi "a,b,c" → mảng URL, bỏ khoảng trắng và phần tử rỗng. */
const originListSchema = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(z.array(httpUrlSchema).min(1));

/**
 * Kênh gửi email: `console` chỉ in ra log (không gửi thật), `resend` gọi HTTP API của Resend,
 * `smtp` gửi qua máy chủ SMTP của Gmail bằng Nodemailer (không cần domain riêng).
 */
export const EMAIL_PROVIDERS = Object.freeze({
  CONSOLE: 'console',
  RESEND: 'resend',
  SMTP: 'smtp',
});

const GOOGLE_VARIABLES = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'];
const R2_VARIABLES = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
// SMTP_PORT, SMTP_SECURE có mặc định nên không nằm trong nhóm bắt buộc.
const SMTP_VARIABLES = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];

/** Nhóm biến "đủ cả hoặc trống cả" của dịch vụ tuỳ chọn, kèm tên hiển thị trong lỗi. */
const OPTIONAL_SERVICE_GROUPS = [
  { name: 'Google OAuth', keys: GOOGLE_VARIABLES },
  { name: 'Cloudflare R2', keys: R2_VARIABLES },
  { name: 'SMTP', keys: SMTP_VARIABLES },
];

/**
 * Nhóm biến của dịch vụ tuỳ chọn phải "đủ cả hoặc trống cả" — thiếu một biến là cấu hình sai.
 * @param {Object} data env đã parse
 * @param {string[]} keys
 * @returns {boolean} true nếu đủ cả nhóm
 */
function isVariableGroupComplete(data, keys) {
  return keys.every((key) => Boolean(data[key]));
}

/**
 * @param {string} timeZone
 * @returns {boolean} true nếu là múi giờ IANA mà Node hỗ trợ
 */
function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Kênh gửi email MẶC ĐỊNH (dùng khi Super Admin chưa chọn kênh ở trang Cấu hình).
 * Không đặt `EMAIL_DELIVERY`: development/test in ra terminal; production dùng Resend nếu đã
 * cấu hình, không thì SMTP.
 * @param {Object} data env đã parse
 * @returns {string} một giá trị trong EMAIL_PROVIDERS
 */
function resolveEmailDelivery(data) {
  if (data.EMAIL_DELIVERY) return data.EMAIL_DELIVERY;
  if (data.NODE_ENV !== 'production') return EMAIL_PROVIDERS.CONSOLE;
  if (!data.RESEND_API_KEY && isVariableGroupComplete(data, SMTP_VARIABLES)) {
    return EMAIL_PROVIDERS.SMTP;
  }
  return EMAIL_PROVIDERS.RESEND;
}

/**
 * Người gửi mặc định: SMTP thường chỉ cho gửi dưới địa chỉ của tài khoản đăng nhập (Gmail tự
 * thay `From` bằng địa chỉ đó) → lấy `SMTP_USER` nếu nó là địa chỉ email.
 * @param {Object} data env đã parse
 * @returns {string}
 */
function resolveEmailFrom(data) {
  if (data.EMAIL_FROM) return data.EMAIL_FROM;
  if (data.SMTP_USER?.includes('@')) return `MERN Base <${data.SMTP_USER}>`;
  return 'MERN Base <no-reply@localhost>';
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    MONGODB_URI: z
      .string()
      .regex(/^mongodb(\+srv)?:\/\//, 'Phải bắt đầu bằng mongodb:// hoặc mongodb+srv://'),
    CORS_ORIGINS: originListSchema,
    // URL frontend — dùng để dựng link trong email (xác thực, đặt lại mật khẩu...).
    APP_URL: httpUrlSchema.optional(),
    // Để trống → dùng mặc định theo NODE_ENV (xem buildEnv bên dưới).
    TRUST_PROXY: z.coerce.number().int().min(0).optional(),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
    // Mỗi +1 làm thời gian hash tăng gấp đôi. ≥ 10 theo khuyến nghị bảo mật.
    BCRYPT_COST: z.coerce.number().int().min(10).max(15).default(12),
    RATE_LIMIT_ENABLED: z.stringbool().default(true),
    // Khoá ký access token (JWT HS256). Sinh bằng: openssl rand -base64 48
    JWT_ACCESS_SECRET: z.string().min(32, 'Tối thiểu 32 ký tự'),
    // Cookie refresh token. Mặc định Lax: frontend gọi API cùng site (proxy /api qua Vercel).
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    COOKIE_SECURE: z.stringbool().optional(),
    // Email: kênh mặc định + thông tin đăng nhập từng kênh. Super Admin đổi kênh ở trang Cấu hình
    // (chỉ chọn được kênh đã cấu hình đủ biến).
    EMAIL_DELIVERY: z.enum(Object.values(EMAIL_PROVIDERS)).optional(),
    EMAIL_FROM: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    // SMTP (tuỳ chọn): đủ cả HOST, USER, PASS = bật; trống cả 3 = tắt.
    SMTP_HOST: z.string().optional(),
    // 587 = STARTTLS (nâng lên TLS sau khi kết nối), 465 = TLS ngay từ đầu.
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    // Để trống → true khi cổng 465, false với cổng khác.
    SMTP_SECURE: z.stringbool().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    // Google OAuth (tuỳ chọn): đủ cả 3 biến = bật, trống cả 3 = tắt (nút Google bị ẩn).
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: httpUrlSchema.optional(),
    // Cloudflare R2 (tuỳ chọn): đủ cả 4 biến = bật lưu trữ file, trống cả 4 = tắt.
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    // Lịch tự động: múi giờ tính "lúc HH:mm" của job, bật bộ chạy trong tiến trình (mỗi phút),
    // secret cho endpoint kích hoạt từ ngoài (cron của nền tảng deploy). Trống secret = tắt endpoint.
    JOBS_TIMEZONE: z
      .string()
      .refine(isValidTimeZone, 'Múi giờ IANA không hợp lệ (vd. Asia/Ho_Chi_Minh)')
      .default('Asia/Ho_Chi_Minh'),
    JOBS_RUNNER_ENABLED: z.stringbool().default(true),
    JOBS_TRIGGER_SECRET: z.string().min(32, 'Tối thiểu 32 ký tự').optional(),
  })
  .superRefine((data, ctx) => {
    const requireVariable = (key, reason) => {
      if (!data[key]) ctx.addIssue({ code: 'custom', path: [key], message: `Bắt buộc ${reason}` });
    };

    if (data.NODE_ENV === 'production') requireVariable('APP_URL', 'ở production');
    // Trình duyệt bỏ cookie SameSite=None nếu thiếu Secure.
    if (data.COOKIE_SAME_SITE === 'none' && data.COOKIE_SECURE === false) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'Phải bật khi COOKIE_SAME_SITE=none',
      });
    }
    for (const group of OPTIONAL_SERVICE_GROUPS) {
      const setCount = group.keys.filter((key) => data[key]).length;
      if (setCount === 0 || setCount === group.keys.length) continue;
      for (const key of group.keys.filter((name) => !data[name])) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `${group.name} cần đủ cả ${group.keys.length} biến (hoặc bỏ trống cả nhóm để tắt)`,
        });
      }
    }
    const emailDelivery = resolveEmailDelivery(data);
    if (emailDelivery === EMAIL_PROVIDERS.RESEND) {
      requireVariable(
        'RESEND_API_KEY',
        data.EMAIL_DELIVERY
          ? 'khi EMAIL_DELIVERY=resend'
          : 'ở production (hoặc cấu hình nhóm SMTP_* để gửi qua SMTP)',
      );
    }
    // Thiếu một phần nhóm SMTP đã được báo ở vòng lặp trên; ở đây chỉ báo khi trống cả nhóm.
    if (emailDelivery === EMAIL_PROVIDERS.SMTP && SMTP_VARIABLES.every((key) => !data[key])) {
      for (const key of SMTP_VARIABLES) requireVariable(key, 'khi EMAIL_DELIVERY=smtp');
    }
    // Resend chỉ gửi từ domain đã xác minh → không có người gửi mặc định dùng được.
    if (data.RESEND_API_KEY) requireVariable('EMAIL_FROM', 'khi cấu hình Resend');
  });

/**
 * Parse và bổ sung giá trị mặc định phụ thuộc NODE_ENV.
 * @param {Object} source object dạng process.env (key → chuỗi)
 * @returns {Object} cấu hình đã validate, chỉ đọc
 * @throws {Error} liệt kê toàn bộ biến sai khi không hợp lệ (fail fast)
 */
export function buildEnv(source) {
  // `KEY=` trong .env cho ra chuỗi rỗng → coi như chưa đặt để dùng giá trị mặc định
  // (tránh z.coerce.number('') thành 0).
  const definedValues = Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== ''),
  );
  const result = envSchema.safeParse(definedValues);

  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Biến môi trường không hợp lệ:\n${lines.join('\n')}`);
  }

  const parsed = result.data;
  const isProduction = parsed.NODE_ENV === 'production';
  const defaultLogLevel = { development: 'debug', test: 'silent', production: 'info' };

  return Object.freeze({
    ...parsed,
    IS_PRODUCTION: isProduction,
    IS_DEVELOPMENT: parsed.NODE_ENV === 'development',
    // Bỏ "/" cuối để ghép đường dẫn không bị "//".
    APP_URL: (parsed.APP_URL ?? 'http://localhost:5173').replace(/\/+$/, ''),
    // Production chạy sau 1 reverse proxy (Render) → tin 1 hop để lấy đúng IP client.
    TRUST_PROXY: parsed.TRUST_PROXY ?? (isProduction ? 1 : 0),
    LOG_LEVEL: parsed.LOG_LEVEL ?? defaultLogLevel[parsed.NODE_ENV],
    EMAIL_DELIVERY: resolveEmailDelivery(parsed),
    // Cookie Secure (chỉ gửi qua HTTPS): bắt buộc với SameSite=None, mặc định bật ở production.
    COOKIE_SECURE: parsed.COOKIE_SECURE ?? (isProduction || parsed.COOKIE_SAME_SITE === 'none'),
    EMAIL_FROM: resolveEmailFrom(parsed),
    RESEND_ENABLED: Boolean(parsed.RESEND_API_KEY),
    SMTP_ENABLED: isVariableGroupComplete(parsed, SMTP_VARIABLES),
    SMTP_SECURE: parsed.SMTP_SECURE ?? parsed.SMTP_PORT === 465,
    GOOGLE_OAUTH_ENABLED: isVariableGroupComplete(parsed, GOOGLE_VARIABLES),
    STORAGE_ENABLED: isVariableGroupComplete(parsed, R2_VARIABLES),
  });
}

export const env = buildEnv(process.env);
