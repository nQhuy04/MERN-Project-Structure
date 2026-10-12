import { usersService } from '../users/users.service.js';

/**
 * Resolver "nơi dùng" của media — MongoDB không có khoá ngoại nên module media phải hỏi từng
 * loại tài nguyên xem ảnh nào đang được dùng. Thêm loại tài nguyên dùng ảnh (vd. ảnh bài viết)
 * = thêm một resolver ở đây.
 *
 * @typedef {Object} MediaUsage
 * @property {string} mediaId
 * @property {string} label mô tả nơi dùng, hiển thị cho quản trị viên
 * @property {string} href đường dẫn (frontend) tới nơi dùng
 */

const RESOLVERS = [
  {
    type: 'user-avatar',
    /**
     * @param {Array} [mediaIds] bỏ trống = mọi ảnh đang dùng
     * @returns {Promise} resolve MediaUsage[]
     */
    async findUsages(mediaIds) {
      const usages = await usersService.findAvatarUsages(mediaIds);
      return usages.map((usage) => ({
        mediaId: usage.mediaId,
        label: `Ảnh đại diện của ${usage.name}`,
        href: `/admin/users?q=${encodeURIComponent(usage.email)}`,
      }));
    },
  },
];

/**
 * Nơi dùng của các ảnh (hoặc mọi ảnh đang dùng nếu bỏ trống).
 * @param {Array} [mediaIds]
 * @returns {Promise} resolve MediaUsage[]
 */
export async function findMediaUsages(mediaIds) {
  const results = await Promise.all(RESOLVERS.map((resolver) => resolver.findUsages(mediaIds)));
  return results.flat();
}
