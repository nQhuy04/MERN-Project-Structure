import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { API_URL, PUBLIC_SETTINGS } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute } from '../utils';

function mockGoogleEnabled(enabled) {
  server.use(
    http.get(`${API_URL}/settings/public`, () =>
      HttpResponse.json({
        success: true,
        data: {
          ...PUBLIC_SETTINGS,
          features: { ...PUBLIC_SETTINGS.features, googleOAuth: enabled },
        },
      }),
    ),
  );
}

describe('[bai-10] Đăng nhập bằng Google', () => {
  it('server đã cấu hình → nút Google trỏ tới API (điều hướng trình duyệt, không phải route SPA)', async () => {
    mockGoogleEnabled(true);
    renderRoute('/login');

    expect(await screen.findByRole('link', { name: /Tiếp tục với Google/ })).toHaveAttribute(
      'href',
      `${API_URL}/auth/google`,
    );
  });

  it('server chưa cấu hình → không có nút Google', async () => {
    mockGoogleEnabled(false);
    renderRoute('/login');

    await screen.findByRole('heading', { name: 'Đăng nhập' });
    await screen.findByRole('tab', { name: 'Mật khẩu' });
    expect(screen.queryByRole('link', { name: /Google/ })).toBeNull();
  });

  it('Google chuyển về thành công → phiên được khôi phục từ cookie → vào dashboard', async () => {
    server.use(
      http.post(`${API_URL}/auth/refresh`, () =>
        HttpResponse.json({ success: true, data: { accessToken: 't', user: TEST_USERS.MEMBER } }),
      ),
    );
    const { router } = renderRoute('/auth/callback');

    expect(await screen.findByRole('heading', { name: 'Trang của tôi' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it.each([
    ['OAUTH_CANCELLED', 'Bạn đã huỷ đăng nhập bằng Google.'],
    ['REGISTRATION_DISABLED', 'Hệ thống đang tạm dừng đăng ký tài khoản mới.'],
    ['MA_LA', 'Không thể đăng nhập bằng Google, vui lòng thử lại.'],
  ])('?error=%s → thông báo tương ứng', async (code, message) => {
    renderRoute(`/auth/callback?error=${code}`);

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
  });
});
