// db.js phải được import trước model (cấu hình mongoose toàn cục) — và nạp .env qua env.js.
import { db } from '../src/shared/config/db.js';
import { logger } from '../src/shared/lib/logger.js';
import { z } from '../src/shared/lib/zod.js';
import { emailSchema, nameSchema, passwordSchema } from '../src/modules/users/users.schema.js';
import { jobsService } from '../src/modules/jobs/jobs.service.js';
import { usersService } from '../src/modules/users/users.service.js';

/**
 * Seed dữ liệu bắt buộc, idempotent (chạy lại bao nhiêu lần cũng an toàn):
 * `npm run db:seed`. Không chạy tự động khi server khởi động.
 *
 * Biến SEED_* chỉ cần cho script này nên validate tại đây, không đưa vào env của app.
 */
const seedEnvSchema = z.object({
  SEED_SUPER_ADMIN_EMAIL: emailSchema,
  SEED_SUPER_ADMIN_PASSWORD: passwordSchema,
  SEED_SUPER_ADMIN_NAME: nameSchema.default('Super Admin'),
});

function readSeedEnv() {
  // `KEY=` để trống → coi như chưa đặt (giống env.js).
  const definedValues = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== ''),
  );
  const result = seedEnvSchema.safeParse(definedValues);

  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  - ${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Biến môi trường cho seed không hợp lệ:\n${lines.join('\n')}`);
  }
  return result.data;
}

async function seedSuperAdmin(seedEnv) {
  const { created, user } = await usersService.ensureSuperAdmin({
    email: seedEnv.SEED_SUPER_ADMIN_EMAIL,
    name: seedEnv.SEED_SUPER_ADMIN_NAME,
    password: seedEnv.SEED_SUPER_ADMIN_PASSWORD,
  });

  if (created) logger.info({ email: user.email }, 'Đã tạo Super Admin');
  else logger.info({ email: user.email }, 'Đã có Super Admin — bỏ qua');
}

async function seed() {
  const seedEnv = readSeedEnv();

  await db.connectDB();
  try {
    await seedSuperAdmin(seedEnv);
    const createdJobs = await jobsService.ensureSystemJobs();
    logger.info({ createdJobs }, 'Đã kiểm tra job hệ thống');
  } finally {
    await db.disconnectDB();
  }
}

seed().catch((err) => {
  logger.fatal({ err }, 'Seed thất bại');
  process.exitCode = 1;
});
