import { QueryClient } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { expireSession, useAuthStore } from '@/features/auth';
import { http as httpClient } from '@/shared/lib/http';
import { API_URL } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute, selectMenuItem, signInAs } from '../utils';

function mockRefreshSuccess(accessToken = 'token-moi') {
  let callCount = 0;
  server.use(
    http.post(`${API_URL}/auth/refresh`, () => {
      callCount += 1;
      return HttpResponse.json({ success: true, data: { accessToken, user: TEST_USERS.MEMBER } });
    }),
  );
  return () => callCount;
}

function unauthorized() {
  return HttpResponse.json(
    {
      success: false,
      error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Phiên đăng nhập đã hết hạn' },
    },
    { status: 401 },
  );
}

describe('[bai-06] Khôi phục phiên khi mở app', () => {
  it('còn refresh token hợp lệ → mở thẳng /dashboard không bị đá về đăng nhập', async () => {
    const getRefreshCount = mockRefreshSuccess();

    const { router } = renderRoute('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Trang của tôi' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/dashboard');
    expect(useAuthStore.getState().accessToken).toBe('token-moi');
    // Strict Mode chạy effect 2 lần nhưng chỉ refresh 1 lần.
    expect(getRefreshCount()).toBe(1);
  });

  it('không có phiên → trang cần đăng nhập chuyển về /login', async () => {
    const { router } = renderRoute('/dashboard');

    await screen.findByRole('heading', { name: 'Đăng nhập' });
    expect(router.state.location.pathname).toBe('/login');
  });
});

describe('[bai-06] http client — tự refresh khi access token hết hạn', () => {
  it('401 → refresh → gửi lại request với token mới', async () => {
    signInAs(TEST_USERS.MEMBER);
    mockRefreshSuccess('token-moi');
    const seenAuthHeaders = [];
    server.use(
      http.get(`${API_URL}/probe`, ({ request }) => {
        const authorization = request.headers.get('Authorization');
        seenAuthHeaders.push(authorization);
        return authorization === 'Bearer token-moi'
          ? HttpResponse.json({ success: true, data: 'ok' })
          : unauthorized();
      }),
    );

    const response = await httpClient.get('/probe');

    expect(response.data.data).toBe('ok');
    expect(seenAuthHeaders).toEqual(['Bearer token-u-member', 'Bearer token-moi']);
  });

  it('nhiều request cùng nhận 401 → chỉ gọi refresh 1 lần', async () => {
    signInAs(TEST_USERS.MEMBER);
    const getRefreshCount = mockRefreshSuccess('token-moi');
    server.use(
      http.get(`${API_URL}/probe`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer token-moi'
          ? HttpResponse.json({ success: true, data: 'ok' })
          : unauthorized(),
      ),
    );

    await Promise.all([
      httpClient.get('/probe'),
      httpClient.get('/probe'),
      httpClient.get('/probe'),
    ]);

    expect(getRefreshCount()).toBe(1);
  });

  it('refresh thất bại → xoá phiên, request gốc báo lỗi, không lặp vô hạn', async () => {
    signInAs(TEST_USERS.MEMBER);
    let probeCount = 0;
    server.use(
      http.get(`${API_URL}/probe`, () => {
        probeCount += 1;
        return unauthorized();
      }),
    );

    await expect(httpClient.get('/probe')).rejects.toMatchObject({ code: 'AUTH_TOKEN_EXPIRED' });
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(probeCount).toBe(1);
  });

  it('đang ở trang cần đăng nhập mà phiên hết hạn → thông báo và về trang đăng nhập', async () => {
    const user = userEvent.setup();
    signInAs(TEST_USERS.MEMBER);
    server.use(http.patch(`${API_URL}/users/me`, unauthorized));
    renderRoute('/account/profile');

    const nameInput = await screen.findByLabelText('Họ tên');
    await user.type(nameInput, ' Mới');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(
      await screen.findByText('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'),
    ).toBeInTheDocument();
    await screen.findByRole('heading', { name: 'Đăng nhập' });
  });
});

describe('[bai-06] Đăng xuất', () => {
  it('gọi API thu hồi phiên rồi dọn phiên phía client', async () => {
    const user = userEvent.setup();
    let logoutCalled = false;
    server.use(
      http.post(`${API_URL}/auth/logout`, () => {
        logoutCalled = true;
        return HttpResponse.json({ success: true, message: 'Đã đăng xuất', data: null });
      }),
    );
    signInAs(TEST_USERS.MEMBER);
    const { router } = renderRoute('/dashboard');

    await selectMenuItem(user, { menu: /Thành Viên/, item: 'Đăng xuất' });

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(logoutCalled).toBe(true);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('server lỗi khi đăng xuất → vẫn dọn phiên phía client', async () => {
    const user = userEvent.setup();
    server.use(http.post(`${API_URL}/auth/logout`, () => HttpResponse.error()));
    signInAs(TEST_USERS.MEMBER);
    const { router } = renderRoute('/dashboard');

    await selectMenuItem(user, { menu: /Thành Viên/, item: 'Đăng xuất' });

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('[bai-06] Đổi chủ phiên trên cùng tab', () => {
  /** staleTime như bản chạy thật: không xoá cache thì dữ liệu người trước được dùng lại. */
  function createRealisticClient() {
    return new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    });
  }

  /** Server trả danh sách phiên khác nhau tuỳ access token đang gửi lên. */
  function mockSessionsPerUser() {
    server.use(
      http.get(`${API_URL}/sessions`, ({ request }) => {
        const isAdmin = request.headers.get('Authorization')?.includes(TEST_USERS.ADMIN.id);
        return HttpResponse.json({
          success: true,
          data: [
            {
              id: isAdmin ? 's-admin' : 's-member',
              device: {
                browser: isAdmin ? 'Firefox' : 'Chrome',
                os: isAdmin ? 'Linux' : 'Windows',
                deviceType: 'desktop',
              },
              ip: '10.0.0.1',
              lastUsedAt: '2026-09-28T10:00:00.000Z',
              isCurrent: true,
            },
          ],
        });
      }),
    );
  }

  it('A hết phiên → B đăng nhập: B không thấy dữ liệu của A', async () => {
    mockSessionsPerUser();
    signInAs(TEST_USERS.MEMBER);
    const { router } = renderRoute('/account/sessions', createRealisticClient());
    expect(await screen.findByText(/Chrome/)).toBeInTheDocument();

    // Phiên của A hết hạn → guard đưa về trang đăng nhập; B đăng nhập trên đúng tab đó.
    act(() => {
      expireSession();
    });
    await screen.findByRole('heading', { name: 'Đăng nhập' });
    act(() => signInAs(TEST_USERS.ADMIN));
    await router.navigate('/account/sessions');

    expect(await screen.findByText(/Firefox/)).toBeInTheDocument();
    expect(screen.queryByText(/Chrome/)).not.toBeInTheDocument();
  });

  it('làm mới access token cho CÙNG người dùng → giữ nguyên cache', async () => {
    mockSessionsPerUser();
    signInAs(TEST_USERS.MEMBER);
    const client = createRealisticClient();
    renderRoute('/account/sessions', client);
    await screen.findByText(/Chrome/);

    act(() =>
      useAuthStore.getState().setSession({ accessToken: 'token-moi', user: TEST_USERS.MEMBER }),
    );

    expect(client.getQueryCache().getAll()).not.toHaveLength(0);
  });
});
