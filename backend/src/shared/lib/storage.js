import { AwsClient } from 'aws4fetch';
import { env } from '../config/env.js';

/**
 * Bọc Cloudflare R2 (API tương thích S3) bằng aws4fetch — chỉ ký request, không cần SDK nặng.
 * File đi thẳng giữa trình duyệt và R2 qua presigned URL: server không nhận nội dung file.
 * Export dạng object để test thay bằng `vi.spyOn(storage, ...)`.
 */

const UPLOAD_URL_TTL_SECONDS = 10 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;
const HTTP_NOT_FOUND = 404;

const client = env.STORAGE_ENABLED
  ? new AwsClient({
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      service: 's3',
      region: 'auto',
    })
  : null;

/**
 * @param {string} key object key trong bucket
 * @returns {URL}
 */
function objectUrl(key) {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${encodedKey}`,
  );
}

/**
 * Presigned URL để trình duyệt PUT file thẳng lên R2. Ký cả Content-Type và Content-Length →
 * client gửi sai loại hoặc sai dung lượng so với lúc xin URL thì R2 từ chối.
 * @param {Object} params
 * @param {string} params.key
 * @param {string} params.contentType
 * @param {number} params.contentLength byte
 * @returns {Promise} resolve `{ url, method, headers }` — client phải gửi đúng các header này
 */
async function createUploadUrl({ key, contentType, contentLength }) {
  const url = objectUrl(key);
  url.searchParams.set('X-Amz-Expires', String(UPLOAD_URL_TTL_SECONDS));
  const headers = { 'Content-Type': contentType, 'Content-Length': String(contentLength) };

  const signed = await client.sign(new Request(url, { method: 'PUT', headers }), {
    aws: { signQuery: true, allHeaders: true },
  });
  return { url: signed.url, method: 'PUT', headers: { 'Content-Type': contentType } };
}

/**
 * Presigned URL tải file (hết hạn sau 5 phút).
 * @param {Object} params
 * @param {string} params.key
 * @param {string} [params.downloadName] tên file khi tải về (đặt header Content-Disposition)
 * @returns {Promise} resolve URL (string)
 */
async function createDownloadUrl({ key, downloadName }) {
  const url = objectUrl(key);
  url.searchParams.set('X-Amz-Expires', String(DOWNLOAD_URL_TTL_SECONDS));
  if (downloadName) {
    url.searchParams.set(
      'response-content-disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
    );
  }

  const signed = await client.sign(new Request(url, { method: 'GET' }), {
    aws: { signQuery: true },
  });
  return signed.url;
}

/**
 * Thông tin object thật trên R2 (dùng để đối chiếu sau khi client báo upload xong).
 * @param {string} key
 * @returns {Promise} resolve `{ contentType, size }` hoặc `null` nếu không tồn tại
 * @throws {Error} lỗi khác 404 từ R2
 */
async function headObject(key) {
  const response = await client.fetch(objectUrl(key), { method: 'HEAD' });
  if (response.status === HTTP_NOT_FOUND) return null;
  if (!response.ok) throw new Error(`R2 HEAD lỗi ${response.status}`);

  return {
    contentType: response.headers.get('content-type'),
    size: Number(response.headers.get('content-length')),
  };
}

/**
 * Xoá object (không tồn tại cũng coi là thành công).
 * @param {string} key
 * @returns {Promise} resolve khi xong
 * @throws {Error} lỗi từ R2
 */
async function deleteObject(key) {
  const response = await client.fetch(objectUrl(key), { method: 'DELETE' });
  if (!response.ok && response.status !== HTTP_NOT_FOUND) {
    throw new Error(`R2 DELETE lỗi ${response.status}`);
  }
}

export const storage = { createUploadUrl, createDownloadUrl, headObject, deleteObject };
