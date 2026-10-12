import { z } from '../../shared/lib/zod.js';
import { idParamsSchema } from '../../shared/utils/commonSchemas.js';
import { paginationQuerySchema } from '../../shared/utils/pagination.js';
import { USER_ROLES, USER_STATUSES } from './users.constants.js';

/** Tham số lọc để trống (`?role=`) = không lọc. */
const emptyToUndefined = (schema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

/** Chỉ cho sắp xếp theo các trường có trong whitelist (có index / hợp lý để sắp xếp). */
export const USER_SORT_OPTIONS = Object.freeze([
  '-createdAt',
  'createdAt',
  'name',
  '-name',
  '-lastLoginAt',
]);

export const listUsersQuerySchema = paginationQuerySchema.extend({
  q: emptyToUndefined(z.string().trim().max(100)),
  role: emptyToUndefined(z.enum(Object.values(USER_ROLES))),
  status: emptyToUndefined(z.enum(Object.values(USER_STATUSES))),
  sort: z.enum(USER_SORT_OPTIONS).default('-createdAt'),
});

export const userIdParamsSchema = idParamsSchema;

/** Không ai gán được SUPER_ADMIN qua API — chỉ MEMBER ↔ ADMIN. */
export const changeRoleBodySchema = z.object({
  role: z.enum([USER_ROLES.MEMBER, USER_ROLES.ADMIN]),
});
