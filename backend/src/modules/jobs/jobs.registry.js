// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 14.
import { db } from '../../shared/config/db.js';
import { EMAIL_PROVIDERS } from '../../shared/config/env.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { logger } from '../../shared/lib/logger.js';
import { z } from '../../shared/lib/zod.js';
import { objectIdSchema } from '../../shared/utils/commonSchemas.js';
import { emailTokensService } from '../auth/emailTokens.service.js';
import { emailService } from '../email/email.service.js';
import { filesService } from '../files/files.service.js';
import { mediaService } from '../media/media.service.js';
import { USER_ROLES } from '../users/users.constants.js';
import { usersService } from '../users/users.service.js';

/**
 * Nơi DUY NHẤT khai báo loại job. Thêm loại job = thêm một mục: Zod schema cho config, mô tả ô
 * nhập (frontend sinh form từ đây), handler. Handler gọi service export của các module khác.
 *
 * @typedef {Object} JobTypeDefinition
 * @property {string} label
 * @property {string} description
 * @property {boolean} isSystemOnly true = chỉ job hệ thống (seed) dùng, quản trị viên không tạo mới
 * @property {Object} configSchema Zod schema của config
 * @property {Object[]} configFields mô tả ô nhập `{ name, label, input, min?, max? }`
 * @property {Function} handler `async (config, { now }) => kết quả (lưu vào lịch sử chạy)`
 */

export const JOB_TYPES = Object.freeze({
  CLEANUP_ORPHAN_MEDIA: 'CLEANUP_ORPHAN_MEDIA',
  CLEANUP_PENDING_UPLOADS: 'CLEANUP_PENDING_UPLOADS',
  CLEANUP_UNVERIFIED_USERS: 'CLEANUP_UNVERIFIED_USERS',
  SEND_EMAIL: 'SEND_EMAIL',
});

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Số người nhận tối đa mỗi lượt chạy job gửi email — phần dư đi ở lượt kế tiếp. */
const MAX_RECIPIENTS_PER_RUN = 200;

/**
 * Nghỉ giữa hai email để không vượt hạn mức của nhà cung cấp (gói Resend free ~2 email/giây;
 * SMTP miễn phí như Gmail cũng chặn khi gửi dồn dập). Kênh `console` chỉ in ra log → không nghỉ.
 */
const EMAIL_THROTTLE_MS = 600;

/** @param {number} ms @returns {Promise} resolve sau `ms` mili giây */
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** @type {Object} type → JobTypeDefinition */
export const JOB_DEFINITIONS = Object.freeze({
  [JOB_TYPES.CLEANUP_ORPHAN_MEDIA]: {
    label: 'Dọn ảnh mồ côi',
    description: 'Xoá ảnh không còn nơi nào dùng và đã tải lên quá 24 giờ.',
    isSystemOnly: true,
    configSchema: z.object({}),
    configFields: [],
    // TODO(bai-14): gọi `mediaService.cleanupOrphans({ now })` (bài 13) và trả
    // `{ deletedCount: <kết quả> }`. Handler gọi **service export** của module khác, không bao
    // giờ import model của module khác — xem ghi chú ở đầu file.
    handler: async () => notImplemented('bai-14'),
  },

  [JOB_TYPES.CLEANUP_PENDING_UPLOADS]: {
    label: 'Dọn upload dở',
    description: 'Xoá file / ảnh đã xin URL tải lên nhưng không hoàn tất.',
    isSystemOnly: true,
    configSchema: z.object({ olderThanHours: z.number().int().min(1).max(168).default(24) }),
    configFields: [
      { name: 'olderThanHours', label: 'Quá (giờ)', input: 'number', min: 1, max: 168 },
    ],
    // TODO(bai-14): đổi `olderThanHours` sang mili giây (`* HOUR_MS`), rồi gọi
    // `filesService.cleanupPendingUploads` và `mediaService.cleanupPendingUploads` với
    // `{ olderThanMs, now }`. Trả `{ files, media }` — hai con số riêng, để lịch sử chạy nói
    // được đã dọn bao nhiêu ở mỗi bên.
    handler: async () => notImplemented('bai-14'),
  },

  [JOB_TYPES.CLEANUP_UNVERIFIED_USERS]: {
    label: 'Dọn tài khoản chưa kích hoạt',
    description: 'Xoá tài khoản không kích hoạt email sau N ngày (kèm token email của họ).',
    isSystemOnly: true,
    configSchema: z.object({ olderThanDays: z.number().int().min(1).max(365).default(7) }),
    configFields: [
      { name: 'olderThanDays', label: 'Quá (ngày)', input: 'number', min: 1, max: 365 },
    ],
    // TODO(bai-14): xoá tài khoản CHƯA kích hoạt tạo trước `now - olderThanDays` ngày.
    // 1. `createdBefore = new Date(now.getTime() - olderThanDays * DAY_MS)`.
    // 2. `userIds = await usersService.findUnverifiedIdsCreatedBefore(createdBefore)`;
    //    mảng rỗng → trả `{ deletedCount: 0 }` ngay, không mở transaction vô ích.
    // 3. Trong `db.runInTransaction`: `emailTokensService.revokeAllForUsers(userIds, { session })`
    //    rồi `usersService.deleteUnverifiedByIds(userIds, { session })` — xoá user mà để lại
    //    token email của họ là bỏ lại rác trỏ vào tài khoản không còn tồn tại.
    // 4. Trả `{ deletedCount }`.
    handler: async () => notImplemented('bai-14'),
  },

  [JOB_TYPES.SEND_EMAIL]: {
    label: 'Gửi email thông báo',
    description:
      'Gửi email tới người dùng đang hoạt động theo vai trò và/hoặc danh sách người dùng.',
    isSystemOnly: false,
    configSchema: z
      .object({
        subject: z.string().trim().min(1, 'Nhập tiêu đề').max(200),
        content: z.string().trim().min(1, 'Nhập nội dung').max(5000),
        roles: z.array(z.enum(Object.values(USER_ROLES))).default([]),
        userIds: z.array(objectIdSchema).max(500).default([]),
      })
      .refine((config) => config.roles.length + config.userIds.length > 0, {
        path: ['roles'],
        message: 'Chọn ít nhất một vai trò hoặc người nhận',
      }),
    configFields: [
      { name: 'subject', label: 'Tiêu đề', input: 'text' },
      { name: 'content', label: 'Nội dung', input: 'textarea' },
      { name: 'roles', label: 'Gửi tới vai trò', input: 'roles' },
    ],
    // TODO(bai-14): gửi email thông báo — xem `docs/08` mục "Gửi email hàng loạt".
    // 1. `recipients = await usersService.findActiveRecipients({ roles, userIds })`.
    // 2. Cắt còn tối đa `MAX_RECIPIENTS_PER_RUN` người; phần dư đi ở lượt chạy sau.
    //    `throttleMs` = 0 nếu `await emailService.getCurrentProvider()` là
    //    `EMAIL_PROVIDERS.CONSOLE` (chỉ in log), ngược lại `EMAIL_THROTTLE_MS`.
    // 3. Gửi **TUẦN TỰ**: vòng `for...of batch.entries()`, từ người thứ hai trở đi thì
    //    `await delay(throttleMs)` nếu giá trị đó > 0. Mỗi người: `try { await
    //    emailService.sendAnnouncementEmail({ user, subject, content }); sentCount += 1 }`,
    //    `catch { failedCount += 1; logger.error(...) }`.
    // 4. `sentCount === 0 && failedCount > 0` → **ném lỗi** để lịch sử chạy ghi FAILED.
    // 5. Trả `{ recipientCount, sentCount, failedCount, skippedCount }`.
    // Gửi song song không giới hạn sẽ vượt hạn mức nhà cung cấp và mất email âm thầm.
    handler: async () => notImplemented('bai-14'),
  },
});

/**
 * Validate config theo loại job (lỗi → ZodError, errorHandler trả VALIDATION_ERROR).
 * @param {string} type
 * @param {*} config
 * @returns {Object} config đã chuẩn hoá (kèm default)
 */
export function parseJobConfig(type, config) {
  const result = JOB_DEFINITIONS[type].configSchema.safeParse(config ?? {});
  if (result.success) return result.data;
  // Lỗi nằm trong `config` của body → thêm tiền tố để frontend gắn đúng ô (vd. `config.subject`).
  throw new z.ZodError(
    result.error.issues.map((issue) => ({ ...issue, path: ['config', ...issue.path] })),
  );
}
