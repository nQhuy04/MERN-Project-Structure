import axios from 'axios';

/**
 * Upload file thẳng từ trình duyệt lên kho lưu trữ (R2) bằng presigned URL — NGOẠI LỆ DUY NHẤT
 * không đi qua http client chung: không được gửi cookie, access token hay header riêng của API
 * sang dịch vụ khác. Dùng axios để có tiến trình upload (fetch chưa hỗ trợ).
 * @param {Object} params
 * @param {Object} params.upload `{ url, method, headers }` do API trả về
 * @param {File} params.file
 * @param {Function} [params.onProgress] nhận phần trăm 0–100
 * @returns {Promise} resolve khi upload xong
 * @throws {Error} upload thất bại (mất mạng, URL hết hạn, sai Content-Type/Length)
 */
export async function uploadToPresignedUrl({ upload, file, onProgress }) {
  await axios.request({
    url: upload.url,
    method: upload.method,
    headers: upload.headers,
    data: file,
    onUploadProgress: (event) => {
      if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
}
