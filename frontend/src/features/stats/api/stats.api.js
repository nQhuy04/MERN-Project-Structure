// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 14.
import { http } from '@/shared/lib/http';
import { notImplemented } from '@/shared/lib/practice';

export const statsKeys = { overview: ['stats', 'overview'] };

/** @returns {Promise} resolve `{ users, media, jobs }` */
export async function getAdminOverview() {
  return notImplemented('bai-14');
}
