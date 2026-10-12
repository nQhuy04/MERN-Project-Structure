import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { logger } from '../../src/shared/lib/logger.js';

describe('[bai-01] requestLogger — log mỗi request', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('request thành công → log info với method, path, status, thời gian', async () => {
    const infoSpy = vi.spyOn(logger, 'info');

    await request(app).get('/api/v1/health');

    expect(infoSpy).toHaveBeenCalledWith(
      { method: 'GET', path: '/api/v1/health', status: 200, durationMs: expect.any(Number) },
      'request',
    );
  });

  it('lỗi phía client → log warn, không ghi query string (có thể chứa token)', async () => {
    const warnSpy = vi.spyOn(logger, 'warn');

    await request(app).get('/api/v1/khong-ton-tai?token=bi-mat');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/khong-ton-tai', status: 404 }),
      'request',
    );
    expect(JSON.stringify(warnSpy.mock.calls)).not.toContain('bi-mat');
  });
});
