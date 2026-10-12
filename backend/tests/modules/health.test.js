import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { db } from '../../src/shared/config/db.js';

describe('[bai-01] GET /api/v1/health', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('trả 200 kèm trạng thái API và database khi DB hoạt động', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { status: 'ok', database: 'up' },
    });
    expect(res.body.data.uptime).toBeTypeOf('number');
    expect(Date.parse(res.body.data.timestamp)).not.toBeNaN();
  });

  it('trả 503 SERVICE_UNAVAILABLE khi DB không phản hồi', async () => {
    vi.spyOn(db, 'pingDB').mockResolvedValue(false);

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu không phản hồi' },
    });
  });
});
