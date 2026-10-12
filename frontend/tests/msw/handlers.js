import { http, HttpResponse } from 'msw';

export const API_URL = 'http://localhost:4000/api/v1';

export const HEALTH_OK = {
  status: 'ok',
  database: 'up',
  uptime: 42,
  timestamp: '2026-09-28T00:00:00.000Z',
};

/** Handler mặc định (đường thành công). Từng test ghi đè bằng `server.use(...)`. */
export const PUBLIC_SETTINGS = {
  settings: { 'auth.registrationEnabled': true, 'auth.magicLinkEnabled': true },
  features: { googleOAuth: false, storage: false },
};

export const ADMIN_OVERVIEW = {
  users: {
    total: 3,
    byRole: { MEMBER: 1, ADMIN: 1, SUPER_ADMIN: 1 },
    byStatus: { ACTIVE: 2, LOCKED: 1, UNVERIFIED: 0 },
  },
  media: { total: 5, orphans: 2 },
  jobs: { total: 3, active: 3, recentFailures: [] },
};

export const handlers = [
  http.get(`${API_URL}/admin/stats`, () =>
    HttpResponse.json({ success: true, data: ADMIN_OVERVIEW }),
  ),
  http.get(`${API_URL}/settings/public`, () =>
    HttpResponse.json({ success: true, data: PUBLIC_SETTINGS }),
  ),
  http.get(`${API_URL}/health`, () => HttpResponse.json({ success: true, data: HEALTH_OK })),
  // Mặc định chưa đăng nhập: khôi phục phiên khi mở app thất bại → người dùng là khách.
  http.post(`${API_URL}/auth/refresh`, () =>
    HttpResponse.json(
      { success: false, error: { code: 'AUTH_TOKEN_INVALID', message: 'Chưa đăng nhập' } },
      { status: 401 },
    ),
  ),
  http.post(`${API_URL}/auth/logout`, () =>
    HttpResponse.json({ success: true, message: 'Đã đăng xuất', data: null }),
  ),
];
