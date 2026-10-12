import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';

const ALLOWED_ORIGIN = 'http://localhost:5173';

describe('[bai-01] App — middleware dùng chung', () => {
  it('route không tồn tại → 404 ROUTE_NOT_FOUND theo định dạng lỗi chuẩn', async () => {
    const res = await request(app).get('/api/v1/khong-ton-tai');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Không tìm thấy đường dẫn GET /api/v1/khong-ton-tai',
      },
    });
  });

  it('gắn header bảo mật của helmet và ẩn X-Powered-By', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('CORS cho phép origin trong whitelist, kèm credentials', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', ALLOWED_ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('CORS không trả header cho origin ngoài whitelist', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'http://evil.example');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('không mount Swagger UI ngoài môi trường development', async () => {
    const res = await request(app).get('/api/docs/');

    expect(res.status).toBe(404);
  });
});
