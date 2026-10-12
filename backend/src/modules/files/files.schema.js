import { z } from '../../shared/lib/zod.js';
import { idParamsSchema } from '../../shared/utils/commonSchemas.js';
import { paginationQuerySchema } from '../../shared/utils/pagination.js';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from './files.constants.js';

export const presignFileBodySchema = z.object({
  fileName: z.string().trim().min(1, 'Thiếu tên file').max(255, 'Tên file quá dài'),
  contentType: z.enum(ALLOWED_FILE_TYPES, 'Chỉ chấp nhận ảnh (JPEG, PNG, WebP, GIF) hoặc PDF'),
  size: z
    .number()
    .int()
    .min(1, 'File rỗng')
    .max(MAX_FILE_SIZE_BYTES, `File tối đa ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`),
});

export const fileIdParamsSchema = idParamsSchema;

export const listFilesQuerySchema = paginationQuerySchema;
