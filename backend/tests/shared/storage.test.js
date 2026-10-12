import { describe, expect, it } from 'vitest';
import { storage } from '../../src/shared/lib/storage.js';

describe('[bai-12] storage — presigned URL cho R2 (chỉ ký, không gọi mạng)', () => {
  it('URL upload ký cả Content-Type + Content-Length, hết hạn 10 phút', async () => {
    const upload = await storage.createUploadUrl({
      key: 'users/u1/abc',
      contentType: 'image/png',
      contentLength: 1234,
    });

    const url = new URL(upload.url);
    expect(url.host).toBe('test-account.r2.cloudflarestorage.com');
    expect(url.pathname).toBe('/test-bucket/users/u1/abc');
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('content-length;content-type;host');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('600');
    expect(url.searchParams.get('X-Amz-Signature')).toMatch(/^[a-f0-9]{64}$/);
    expect(upload).toMatchObject({ method: 'PUT', headers: { 'Content-Type': 'image/png' } });
  });

  it('URL tải về hết hạn 5 phút, đặt tên file (hỗ trợ tiếng Việt)', async () => {
    const url = new URL(
      await storage.createDownloadUrl({ key: 'users/u1/abc', downloadName: 'Hợp đồng.pdf' }),
    );

    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
    expect(url.searchParams.get('response-content-disposition')).toBe(
      "attachment; filename*=UTF-8''H%E1%BB%A3p%20%C4%91%E1%BB%93ng.pdf",
    );
  });
});
