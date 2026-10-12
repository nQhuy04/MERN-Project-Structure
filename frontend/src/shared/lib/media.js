import { API_URL } from '@/shared/lib/http';

/**
 * URL hiển thị ảnh hệ thống (avatar...). Endpoint công khai của API chuyển hướng tới URL có chữ
 * ký tạm thời của kho lưu trữ — dùng trực tiếp trong <img src>.
 * @param {string} mediaId
 * @returns {string}
 */
export function getMediaUrl(mediaId) {
  return `${API_URL}/media/${mediaId}/content`;
}
