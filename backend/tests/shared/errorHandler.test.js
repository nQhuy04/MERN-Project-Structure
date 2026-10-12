import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from '../../src/shared/lib/zod.js';
import { AppError } from '../../src/shared/errors/AppError.js';
import { ERROR_CODES } from '../../src/shared/errors/errorCodes.js';
import { errorHandler } from '../../src/shared/middlewares/errorHandler.js';
import { logger } from '../../src/shared/lib/logger.js';

/** App tối thiểu: route POST /test chạy `handler`, lỗi đi qua errorHandler thật. */
function createTestApp(handler) {
  const testApp = express();
  testApp.use(express.json({ limit: '1kb' }));
  testApp.post('/test', handler);
  testApp.use(errorHandler);
  return testApp;
}

function throwing(err) {
  return createTestApp(() => {
    throw err;
  });
}

describe('[bai-01] errorHandler — chuẩn hoá lỗi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('AppError → giữ nguyên status, code, message, details', async () => {
    const err = new AppError({
      statusCode: 403,
      code: 'FORBIDDEN',
      message: 'Bạn không có quyền',
      details: [{ field: 'role', message: 'Không hợp lệ' }],
    });

    const res = await request(throwing(err)).post('/test');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền',
        details: [{ field: 'role', message: 'Không hợp lệ' }],
      },
    });
  });

  it('ZodError → 400 VALIDATION_ERROR, details theo đường dẫn trường', async () => {
    const schema = z.object({ profile: z.object({ email: z.email() }) });
    const testApp = createTestApp((req) => schema.parse(req.body));

    const res = await request(testApp)
      .post('/test')
      .send({ profile: { email: 'sai' } });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(res.body.error.details).toEqual([
      { field: 'profile.email', message: expect.any(String) },
    ]);
  });

  it('Mongoose ValidationError → 400 VALIDATION_ERROR', async () => {
    const err = new mongoose.Error.ValidationError();
    err.addError(
      'email',
      new mongoose.Error.ValidatorError({ path: 'email', message: 'Email là bắt buộc' }),
    );

    const res = await request(throwing(err)).post('/test');

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Dữ liệu không hợp lệ',
      details: [{ field: 'email', message: 'Email là bắt buộc' }],
    });
  });

  it('Mongoose CastError (ObjectId sai) → 400 thay vì 500', async () => {
    const err = new mongoose.Error.CastError('ObjectId', 'abc', '_id');

    const res = await request(throwing(err)).post('/test');

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { field: '_id', message: 'Giá trị không đúng định dạng' },
    ]);
  });

  it('trùng unique index (Mongo 11000) → 409 DUPLICATE_VALUE kèm tên trường', async () => {
    const collection = mongoose.connection.collection('error_handler_duplicates');
    await collection.createIndex({ email: 1 }, { unique: true });
    await collection.insertOne({ email: 'a@example.com' });

    const testApp = createTestApp(async () => {
      await collection.insertOne({ email: 'a@example.com' });
    });
    const res = await request(testApp).post('/test');

    expect(res.status, JSON.stringify(res.body)).toBe(409);
    expect(res.body.error).toEqual({
      code: ERROR_CODES.DUPLICATE_VALUE,
      message: 'Dữ liệu đã tồn tại',
      details: [{ field: 'email', message: 'Giá trị này đã được sử dụng' }],
    });
  });

  it('JWT hết hạn → 401 AUTH_TOKEN_EXPIRED; JWT sai → 401 AUTH_TOKEN_INVALID', async () => {
    const expired = await request(
      throwing(new jwt.TokenExpiredError('jwt expired', new Date())),
    ).post('/test');
    const invalid = await request(throwing(new jwt.JsonWebTokenError('invalid signature'))).post(
      '/test',
    );

    expect(expired.status).toBe(401);
    expect(expired.body.error.code).toBe('AUTH_TOKEN_EXPIRED');
    expect(invalid.status).toBe(401);
    expect(invalid.body.error.code).toBe('AUTH_TOKEN_INVALID');
  });

  it('body không phải JSON hợp lệ → 400 INVALID_JSON', async () => {
    const testApp = createTestApp((_req, res) => res.end());

    const res = await request(testApp)
      .post('/test')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ERROR_CODES.INVALID_JSON);
  });

  it('body vượt giới hạn → 413 PAYLOAD_TOO_LARGE', async () => {
    const testApp = createTestApp((_req, res) => res.end());

    const res = await request(testApp)
      .post('/test')
      .send({ text: 'x'.repeat(2000) });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe(ERROR_CODES.PAYLOAD_TOO_LARGE);
  });

  it('lỗi không xác định → 500 thông điệp chung, không lộ chi tiết, có log ở server', async () => {
    const logSpy = vi.spyOn(logger, 'error');
    const err = new Error('connection string mongodb://admin:secret@db lộ ra ngoài');

    const res = await request(throwing(err)).post('/test');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Đã có lỗi xảy ra, vui lòng thử lại sau',
      },
    });
    expect(JSON.stringify(res.body)).not.toContain('secret');
    expect(logSpy).toHaveBeenCalledOnce();
  });
});
