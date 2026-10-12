import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { authorize } from '../../src/shared/middlewares/authorize.js';
import { errorHandler } from '../../src/shared/middlewares/errorHandler.js';

/** App tối thiểu: giả lập authenticate bằng header X-Test-Role. */
function createTestApp() {
  const testApp = express();
  testApp.use((req, _res, next) => {
    const role = req.get('x-test-role');
    if (role) req.auth = { role };
    next();
  });
  testApp.get('/admin-only', authorize('ADMIN', 'SUPER_ADMIN'), (_req, res) =>
    res.json({ ok: true }),
  );
  testApp.use(errorHandler);
  return testApp;
}

describe('[bai-05] authorize(...roles) — phân quyền lớp route', () => {
  it.each(['ADMIN', 'SUPER_ADMIN'])('role %s được phép', async (role) => {
    await request(createTestApp()).get('/admin-only').set('X-Test-Role', role).expect(200);
  });

  it('role không nằm trong danh sách → 403 FORBIDDEN', async () => {
    const res = await request(createTestApp()).get('/admin-only').set('X-Test-Role', 'MEMBER');

    expect(res.status).toBe(403);
    expect(res.body.error).toEqual({
      code: 'FORBIDDEN',
      message: 'Bạn không có quyền thực hiện thao tác này',
    });
  });

  it('quên đặt authenticate trước authorize → lỗi 500 (lỗi lập trình, không cho qua)', async () => {
    const res = await request(createTestApp()).get('/admin-only');

    expect(res.status).toBe(500);
  });
});
