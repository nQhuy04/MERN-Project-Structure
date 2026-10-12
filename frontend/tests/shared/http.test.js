import { http as mswHttp, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { http } from '@/shared/lib/http';
import { ApiError } from '@/shared/lib/apiError';
import { API_URL } from '../msw/handlers';
import { server } from '../msw/server';

/** Gọi GET /probe với response do test quyết định, trả về lỗi đã bị ném. */
async function captureError(resolver) {
  server.use(mswHttp.get(`${API_URL}/probe`, resolver));
  try {
    await http.get('/probe');
  } catch (error) {
    return error;
  }
  throw new Error('Request lẽ ra phải thất bại');
}

describe('[bai-01] http client', () => {
  it('gửi header X-Requested-With cho mọi request (chống CSRF)', async () => {
    let receivedHeader;
    server.use(
      mswHttp.get(`${API_URL}/probe`, ({ request }) => {
        receivedHeader = request.headers.get('X-Requested-With');
        return HttpResponse.json({ success: true, data: null });
      }),
    );

    await http.get('/probe');

    expect(receivedHeader).toBe('XMLHttpRequest');
  });

  it('lỗi chuẩn của backend → ApiError giữ status, code, message, details', async () => {
    const error = await captureError(() =>
      HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ',
            details: [{ field: 'email', message: 'Email không hợp lệ' }],
          },
        },
        { status: 400 },
      ),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Dữ liệu không hợp lệ',
      details: [{ field: 'email', message: 'Email không hợp lệ' }],
    });
  });

  it('response lỗi không theo chuẩn (vd. HTML từ proxy) → UNKNOWN_ERROR', async () => {
    const error = await captureError(
      () => new HttpResponse('<html>Bad Gateway</html>', { status: 502 }),
    );

    expect(error).toMatchObject({ status: 502, code: 'UNKNOWN_ERROR', details: [] });
  });

  it('không có response (mất mạng) → NETWORK_ERROR, status 0', async () => {
    const error = await captureError(() => HttpResponse.error());

    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
