import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../../src/shared/middlewares/rateLimit.js';
import { errorHandler } from '../../src/shared/middlewares/errorHandler.js';

function createTestApp({ enabled }) {
  const testApp = express();
  testApp.get('/limited', createRateLimiter({ windowMs: 60_000, limit: 2, enabled }), (_req, res) =>
    res.json({ ok: true }),
  );
  testApp.use(errorHandler);
  return testApp;
}

describe('[bai-01] createRateLimiter — giới hạn request theo IP', () => {
  it('vượt giới hạn → 429 RATE_LIMITED theo định dạng lỗi chuẩn', async () => {
    const testApp = createTestApp({ enabled: true });

    await request(testApp).get('/limited').expect(200);
    await request(testApp).get('/limited').expect(200);
    const res = await request(testApp).get('/limited');

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau ít phút',
      },
    });
    expect(res.headers).toHaveProperty('ratelimit-policy');
  });

  it('tắt (RATE_LIMIT_ENABLED=false) → không chặn', async () => {
    const testApp = createTestApp({ enabled: false });

    for (let i = 0; i < 4; i += 1) await request(testApp).get('/limited').expect(200);
  });
});

describe('[bai-01] createRateLimiter — giới hạn theo userId (đổi mật khẩu)', () => {
  /** Mô phỏng route `PATCH /users/me/password`: authenticate gắn req.auth rồi mới tới limiter. */
  function createUserLimitedApp() {
    const testApp = express();
    testApp.patch(
      '/me/password',
      (req, _res, next) => {
        req.auth = { userId: req.get('x-test-user') };
        next();
      },
      createRateLimiter({
        windowMs: 60_000,
        limit: 2,
        keyGenerator: (req) => String(req.auth.userId),
        enabled: true,
      }),
      (_req, res) => res.json({ ok: true }),
    );
    testApp.use(errorHandler);
    return testApp;
  }

  it('đếm theo user, không theo IP: vượt ngưỡng → 429; user khác cùng IP không bị ảnh hưởng', async () => {
    const testApp = createUserLimitedApp();
    const patch = (userId) => request(testApp).patch('/me/password').set('x-test-user', userId);

    await patch('user-a').expect(200);
    await patch('user-a').expect(200);
    const blocked = await patch('user-a');

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    // Cùng IP (supertest dùng chung 127.0.0.1) nhưng user khác → vẫn đi qua.
    await patch('user-b').expect(200);
  });
});
