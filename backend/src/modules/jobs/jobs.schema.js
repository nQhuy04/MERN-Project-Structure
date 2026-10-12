import { z } from '../../shared/lib/zod.js';
import { idParamsSchema } from '../../shared/utils/commonSchemas.js';
import { paginationQuerySchema } from '../../shared/utils/pagination.js';
import { JOB_DEFINITIONS } from './jobs.registry.js';
import { SCHEDULE_KINDS } from './jobs.schedule.js';

const scheduleSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(SCHEDULE_KINDS.ONCE),
    runAt: z.coerce.date('Thời điểm chạy không hợp lệ'),
  }),
  z.object({
    kind: z.literal(SCHEDULE_KINDS.INTERVAL),
    everyDays: z.number().int().min(1, 'Tối thiểu 1 ngày').max(365, 'Tối đa 365 ngày'),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ dạng HH:mm'),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày dạng YYYY-MM-DD')
      .optional(),
  }),
]);

/** Loại job quản trị viên được tạo mới (loại chỉ dành cho job hệ thống bị loại). */
const creatableTypes = Object.entries(JOB_DEFINITIONS)
  .filter(([, definition]) => !definition.isSystemOnly)
  .map(([type]) => type);

const nameSchema = z.string().trim().min(1, 'Nhập tên job').max(100);

// `config` kiểm tra ở service theo đúng loại job (schema phụ thuộc `type`).
export const createJobBodySchema = z.object({
  name: nameSchema,
  type: z.enum(creatableTypes, 'Loại job không hợp lệ'),
  config: z.record(z.string(), z.unknown()).default({}),
  schedule: scheduleSchema,
});

export const updateJobBodySchema = z
  .object({
    name: nameSchema.optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    schedule: scheduleSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, 'Không có thay đổi nào');

export const jobIdParamsSchema = idParamsSchema;

export const listJobRunsQuerySchema = paginationQuerySchema;
