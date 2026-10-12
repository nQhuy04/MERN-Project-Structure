import { z } from '../../shared/lib/zod.js';
import { idParamsSchema, objectIdSchema } from '../../shared/utils/commonSchemas.js';
import { paginationQuerySchema } from '../../shared/utils/pagination.js';
import {
  MAX_AVATAR_SIZE_BYTES,
  MAX_MEDIA_SIZE_BYTES,
  MEDIA_FOLDER_PATTERN,
  MEDIA_IMAGE_TYPES,
} from './media.constants.js';

const emptyToUndefined = (schema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const folderSchema = z
  .string()
  .trim()
  .regex(MEDIA_FOLDER_PATTERN, 'Tên folder chỉ gồm chữ thường, số, dấu gạch ngang (tối đa 50)');

const imageFileSchema = {
  fileName: z.string().trim().min(1, 'Thiếu tên file').max(255, 'Tên file quá dài'),
  contentType: z.enum(MEDIA_IMAGE_TYPES, 'Chỉ chấp nhận ảnh JPEG, PNG, WebP, GIF'),
};

export const createFolderBodySchema = z.object({ name: folderSchema });

export const folderNameParamsSchema = z.object({ name: folderSchema });

export const presignMediaBodySchema = z.object({
  folder: folderSchema,
  ...imageFileSchema,
  size: z.number().int().min(1).max(MAX_MEDIA_SIZE_BYTES, 'Ảnh tối đa 10MB'),
});

export const presignAvatarBodySchema = z.object({
  ...imageFileSchema,
  size: z.number().int().min(1).max(MAX_AVATAR_SIZE_BYTES, 'Ảnh đại diện tối đa 2MB'),
});

export const mediaIdParamsSchema = idParamsSchema;

export const MEDIA_SORT_OPTIONS = Object.freeze(['-createdAt', 'createdAt', 'name', '-size']);

export const listMediaQuerySchema = paginationQuerySchema.extend({
  folder: emptyToUndefined(folderSchema),
  q: emptyToUndefined(z.string().trim().max(100)),
  type: emptyToUndefined(z.enum(MEDIA_IMAGE_TYPES)),
  usage: emptyToUndefined(z.enum(['in-use', 'orphan'])),
  sort: z.enum(MEDIA_SORT_OPTIONS).default('-createdAt'),
});

/** `mediaId: null` = bỏ ảnh đại diện. */
export const updateAvatarBodySchema = z.object({ mediaId: objectIdSchema.nullable() });
