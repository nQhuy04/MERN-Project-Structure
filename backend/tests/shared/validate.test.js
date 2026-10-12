import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from '../../src/shared/lib/zod.js';
import { validate } from '../../src/shared/middlewares/validate.js';
import { errorHandler } from '../../src/shared/middlewares/errorHandler.js';

const testApp = express();
testApp.use(express.json());
testApp.post(
  '/items/:id',
  validate({
    params: z.object({ id: z.string().regex(/^[a-f0-9]{24}$/, 'ID không hợp lệ') }),
    query: z.object({ page: z.coerce.number().int().min(1).default(1) }),
    body: z.object({ email: z.email(), name: z.string().trim().min(1) }),
  }),
  (req, res) => res.json(req.validated),
);
testApp.use(errorHandler);

const VALID_ID = '65f1a2b3c4d5e6f7a8b9c0d1';

describe('[bai-01] validate middleware', () => {
  it('dữ liệu hợp lệ → gắn req.validated đã ép kiểu, bỏ trường thừa', async () => {
    const res = await request(testApp)
      .post(`/items/${VALID_ID}?page=2`)
      .send({ email: 'a@example.com', name: '  An  ', role: 'SUPER_ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      params: { id: VALID_ID },
      query: { page: 2 },
      body: { email: 'a@example.com', name: 'An' },
    });
  });

  it('gom lỗi của params, query và body vào một response', async () => {
    const res = await request(testApp).post('/items/abc?page=0').send({ email: 'sai', name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((detail) => detail.field)).toEqual([
      'id',
      'page',
      'email',
      'name',
    ]);
  });

  it('không có body → báo lỗi theo từng trường thay vì lỗi chung', async () => {
    const res = await request(testApp).post(`/items/${VALID_ID}`);

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((detail) => detail.field)).toEqual(['email', 'name']);
  });

  it('chặn NoSQL operator injection: object thay cho chuỗi bị từ chối', async () => {
    const res = await request(testApp)
      .post(`/items/${VALID_ID}`)
      .send({ email: { $ne: null }, name: 'An' });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('email');
  });
});
