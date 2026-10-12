import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { API_URL, PUBLIC_SETTINGS } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute, signInAs } from '../utils';

function mockPublicSettings(overrides) {
  server.use(
    http.get(`${API_URL}/settings/public`, () =>
      HttpResponse.json({
        success: true,
        data: { ...PUBLIC_SETTINGS, settings: { ...PUBLIC_SETTINGS.settings, ...overrides } },
      }),
    ),
  );
}

const ADMIN_SETTINGS = [
  {
    key: 'auth.registrationEnabled',
    value: true,
    default: true,
    input: 'boolean',
    label: 'Cho phép đăng ký tài khoản mới',
    description: 'Tắt: ẩn trang đăng ký.',
    updatedAt: null,
    updatedBy: null,
  },
  {
    key: 'auth.magicLinkEnabled',
    value: true,
    default: true,
    input: 'boolean',
    label: 'Đăng nhập bằng liên kết email (magic link)',
    description: 'Tắt: ẩn lựa chọn này.',
    updatedAt: null,
    updatedBy: null,
  },
  {
    key: 'email.provider',
    value: 'console',
    default: 'console',
    input: 'select',
    options: [
      { value: 'console', label: 'Console', disabled: false },
      { value: 'resend', label: 'Resend', disabled: true },
      { value: 'smtp', label: 'SMTP', disabled: false },
    ],
    label: 'Kênh gửi email',
    description: 'Áp dụng cho mọi email.',
    updatedAt: null,
    updatedBy: null,
  },
];

function mockAdminSettings() {
  server.use(
    http.get(`${API_URL}/admin/settings`, () =>
      HttpResponse.json({ success: true, data: ADMIN_SETTINGS }),
    ),
  );
}

describe('[bai-09] Tắt / bật tính năng theo cấu hình công khai', () => {
  it('tắt đăng ký → ẩn nút Đăng ký ở header và trang đăng nhập; trang đăng ký báo tạm dừng', async () => {
    mockPublicSettings({ 'auth.registrationEnabled': false });
    const { unmount } = renderRoute('/login');

    await screen.findByRole('heading', { name: 'Đăng nhập' });
    expect(await screen.findByRole('tab', { name: 'Mật khẩu' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Đăng ký' })).toBeNull();
    unmount();

    renderRoute('/register');
    expect(
      await screen.findByText('Hệ thống đang tạm dừng đăng ký tài khoản mới.'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Họ tên')).toBeNull();
  });

  it('tắt magic link → trang đăng nhập không có tab chọn cách đăng nhập', async () => {
    mockPublicSettings({ 'auth.magicLinkEnabled': false });
    renderRoute('/login');

    expect(await screen.findByRole('link', { name: 'Đăng ký' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByLabelText('Mật khẩu', { selector: 'input' })).toBeInTheDocument();
  });
});

describe('[bai-09] Magic link', () => {
  it('chọn tab "Liên kết email" → gửi email → thông báo chung', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_URL}/auth/magic-link`, () =>
        HttpResponse.json({
          success: true,
          message: 'Nếu email có tài khoản, chúng tôi đã gửi liên kết đăng nhập',
          data: null,
        }),
      ),
    );
    renderRoute('/login');

    await user.click(await screen.findByRole('tab', { name: 'Liên kết email' }));
    await user.type(screen.getByLabelText('Email'), 'an@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi liên kết đăng nhập' }));

    expect(await screen.findByRole('status')).toHaveTextContent('đã gửi liên kết đăng nhập');
  });

  it('mở link → đăng nhập (lưu phiên) → vào dashboard', async () => {
    let requestCount = 0;
    server.use(
      http.post(`${API_URL}/auth/magic-link/verify`, () => {
        requestCount += 1;
        return HttpResponse.json({
          success: true,
          data: { accessToken: 'magic-token', user: TEST_USERS.MEMBER },
        });
      }),
    );
    const { router } = renderRoute('/magic-link?token=abc');

    expect(await screen.findByRole('heading', { name: 'Trang của tôi' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/dashboard');
    expect(useAuthStore.getState().accessToken).toBe('magic-token');
    expect(requestCount).toBe(1);
  });

  it('link hết hạn → báo lỗi', async () => {
    server.use(
      http.post(`${API_URL}/auth/magic-link/verify`, () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'TOKEN_INVALID',
              message: 'Liên kết đăng nhập không hợp lệ hoặc đã hết hạn',
            },
          },
          { status: 400 },
        ),
      ),
    );
    renderRoute('/magic-link?token=cu');

    expect(await screen.findByRole('alert')).toHaveTextContent('không hợp lệ hoặc đã hết hạn');
  });
});

describe('[bai-09] Trang cấu hình hệ thống (Super Admin)', () => {
  it('ADMIN không thấy mục Cấu hình và không vào được trang (403)', async () => {
    signInAs(TEST_USERS.ADMIN);
    const { unmount } = renderRoute('/admin');

    const sidebar = await screen.findByRole('navigation', { name: 'Menu quản trị' });
    expect(within(sidebar).queryByRole('link', { name: 'Cấu hình' })).toBeNull();
    unmount();

    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/settings');
    expect(
      await screen.findByRole('heading', { name: 'Bạn không có quyền truy cập trang này' }),
    ).toBeInTheDocument();
  });

  it('Super Admin đổi setting → chỉ gửi giá trị đã thay đổi, báo thành công', async () => {
    const user = userEvent.setup();
    let receivedBody;
    server.use(
      http.get(`${API_URL}/admin/settings`, () =>
        HttpResponse.json({ success: true, data: ADMIN_SETTINGS }),
      ),
      http.patch(`${API_URL}/admin/settings`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          success: true,
          message: 'Đã lưu cấu hình',
          data: ADMIN_SETTINGS.map((setting) =>
            setting.key in receivedBody.values
              ? { ...setting, value: receivedBody.values[setting.key] }
              : setting,
          ),
        });
      }),
    );
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/settings');

    const saveButton = await screen.findByRole('button', { name: 'Lưu cấu hình' });
    expect(saveButton).toBeDisabled();
    await user.click(screen.getByRole('switch', { name: /magic link/ }));
    await user.click(saveButton);

    expect(await screen.findByText('Đã lưu cấu hình')).toBeInTheDocument();
    expect(receivedBody).toEqual({ values: { 'auth.magicLinkEnabled': false } });
    expect(screen.getByRole('switch', { name: /magic link/ })).not.toBeChecked();
  });
});

describe('[bai-15] Kênh gửi email (Super Admin)', () => {
  it('kênh chưa cấu hình bị khoá; chọn SMTP → lưu đúng giá trị', async () => {
    const user = userEvent.setup();
    let receivedBody;
    mockAdminSettings();
    server.use(
      http.patch(`${API_URL}/admin/settings`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          success: true,
          message: 'Đã lưu cấu hình',
          data: ADMIN_SETTINGS,
        });
      }),
    );
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/settings');

    const select = await screen.findByRole('combobox', { name: 'Kênh gửi email' });
    expect(select).toHaveValue('console');
    expect(screen.getByRole('option', { name: 'Resend (chưa cấu hình)' })).toBeDisabled();

    await user.selectOptions(select, 'smtp');
    await user.click(screen.getByRole('button', { name: 'Lưu cấu hình' }));

    expect(await screen.findByText('Đã lưu cấu hình')).toBeInTheDocument();
    expect(receivedBody).toEqual({ values: { 'email.provider': 'smtp' } });
  });

  it('"Gửi email thử" dùng kênh đang chọn (chưa cần lưu) → báo đã gửi', async () => {
    const user = userEvent.setup();
    let receivedBody;
    mockAdminSettings();
    server.use(
      http.post(`${API_URL}/admin/settings/email-test`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          success: true,
          message: 'Đã gửi email thử tới super@example.com',
          data: { to: 'super@example.com', provider: 'smtp' },
        });
      }),
    );
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/settings');

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Kênh gửi email' }),
      'smtp',
    );
    await user.click(screen.getByRole('button', { name: 'Gửi email thử' }));

    expect(await screen.findByText('Đã gửi email thử tới super@example.com')).toBeInTheDocument();
    expect(receivedBody).toEqual({ provider: 'smtp' });
  });

  it('gửi thử thất bại → hiện lý do từ server', async () => {
    const user = userEvent.setup();
    mockAdminSettings();
    server.use(
      http.post(`${API_URL}/admin/settings/email-test`, () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'EMAIL_DELIVERY_FAILED',
              message: 'Gửi email thử qua smtp thất bại: Invalid login',
            },
          },
          { status: 502 },
        ),
      ),
    );
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/settings');

    await user.click(await screen.findByRole('button', { name: 'Gửi email thử' }));

    expect(
      await screen.findByText('Gửi email thử qua smtp thất bại: Invalid login'),
    ).toBeInTheDocument();
  });
});
