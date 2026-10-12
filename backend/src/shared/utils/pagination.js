import { z } from '../lib/zod.js';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Query phân trang dùng chung: `page` ≥ 1, `limit` 1–100 (chặn client xin cả bảng). */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

/**
 * @param {Object} params `{ page, limit }` đã validate
 * @returns {number} số bản ghi bỏ qua
 */
export function getSkip({ page, limit }) {
  return (page - 1) * limit;
}

/**
 * @param {Object} params `{ page, limit, total }`
 * @returns {Object} `{ page, limit, total, totalPages }`
 */
export function buildPaginationMeta({ page, limit, total }) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
