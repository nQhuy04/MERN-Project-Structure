import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { API_URL } from '../msw/handlers';
import { server } from '../msw/server';
import { renderRoute } from '../utils';

const USER = { id: 'u1', email: 'an@example.com', name: 'Nguyễn An', role: 'MEMBER' };

function mockLoginSuccess() {
  server.use(
    http.post(`${API_URL}/auth/login`, () =>
      HttpResponse.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: { accessToken: 'access-token-1', user: USER },
      }),
    ),
  );
}

function mockLoginError(status, code, message) {
  server.use(
    http.post(`${API_URL}/auth/login`, () =>
      HttpResponse.json({ success: false, error: { code, message } }, { status }),
    ),
  );
}

async function submitLogin(user, { email = 'an@example.com', password = 'mat-khau-an-toan' } = {}) {
  await user.type(await screen.findByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Mật khẩu', { selector: 'input' }), password);
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}

describe('[bai-04] Trang đăng nhập', () => {
  it('thành công → lưu phiên trong bộ nhớ, vào dashboard, header hiện menu người dùng', async () => {
    const user = userEvent.setup();
    mockLoginSuccess();
    const { router } = renderRoute('/login');

    await submitLogin(user);

    expect(await screen.findByRole('button', { name: /Nguyễn An/ })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/dashboard');
    expect(useAuthStore.getState()).toMatchObject({ accessToken: 'access-token-1', user: USER });
    expect(window.localStorage.length).toBe(0);
  });

  it('có ?redirect= nội bộ → quay lại đúng trang đó', async () => {
    const user = userEvent.setup();
    mockLoginSuccess();
    const { router } = renderRoute('/login?redirect=%2Faccount%2Fprofile');

    await submitLogin(user);

    await screen.findByRole('heading', { name: 'Hồ sơ cá nhân' });
    expect(router.state.location.pathname).toBe('/account/profile');
  });

  it('?redirect= trỏ ra ngoài (open redirect) → bỏ qua, vào dashboard', async () => {
    const user = userEvent.setup();
    mockLoginSuccess();
    const { router } = renderRoute('/login?redirect=%2F%2Fevil.example');

    await submitLogin(user);

    await screen.findByRole('heading', { name: 'Trang của tôi' });
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it('sai thông tin → thông báo chung, không lưu phiên', async () => {
    const user = userEvent.setup();
    mockLoginError(400, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng');
    renderRoute('/login');

    await submitLogin(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('chưa kích hoạt → hiện link gửi lại email xác thực kèm email đã nhập', async () => {
    const user = userEvent.setup();
    mockLoginError(403, 'EMAIL_NOT_VERIFIED', 'Tài khoản chưa được kích hoạt');
    renderRoute('/login');

    await submitLogin(user);

    expect(await screen.findByRole('link', { name: 'Gửi lại email xác thực' })).toHaveAttribute(
      'href',
      '/check-email?email=an%40example.com',
    );
  });
});

describe('[bai-04] http client — gắn access token', () => {
  it('có phiên → gửi header Authorization: Bearer <token>', async () => {
    const { http: httpClient } = await import('@/shared/lib/http');
    await import('@/app/providers');
    let authorization;
    server.use(
      http.get(`${API_URL}/probe`, ({ request }) => {
        authorization = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, data: null });
      }),
    );
    useAuthStore.getState().setSession({ accessToken: 'token-abc', user: USER });

    await httpClient.get('/probe');

    expect(authorization).toBe('Bearer token-abc');
  });
});
