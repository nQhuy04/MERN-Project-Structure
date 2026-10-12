import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { API_URL } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute, signInAs } from '../utils';

function errorResponse(status, error) {
  return HttpResponse.json({ success: false, error }, { status });
}

describe('[bai-08] Quên mật khẩu', () => {
  it('gửi email → thông báo chung (không lộ email có tồn tại hay không)', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_URL}/auth/forgot-password`, () =>
        HttpResponse.json({
          success: true,
          message: 'Nếu email có tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu',
          data: null,
        }),
      ),
    );
    renderRoute('/login');

    await user.click(await screen.findByRole('link', { name: 'Quên mật khẩu?' }));
    await user.type(await screen.findByLabelText('Email'), 'an@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi liên kết' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Nếu email có tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu',
    );
  });
});

describe('[bai-08] Đặt lại mật khẩu', () => {
  it('thành công → gửi token + mật khẩu mới, dọn phiên phía client, chỉ đường đăng nhập', async () => {
    const user = userEvent.setup();
    let receivedBody;
    server.use(
      http.post(`${API_URL}/auth/reset-password`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          success: true,
          message: 'Đặt lại mật khẩu thành công',
          data: null,
        });
      }),
    );
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/reset-password?token=abc');

    await user.type(await screen.findByLabelText('Mật khẩu mới'), 'mat-khau-moi-123');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'mat-khau-moi-123');
    await user.click(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }));

    expect(await screen.findByText('Đặt lại mật khẩu thành công')).toBeInTheDocument();
    expect(receivedBody).toEqual({ token: 'abc', password: 'mat-khau-moi-123' });
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('token hết hạn → báo lỗi + link yêu cầu liên kết mới', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_URL}/auth/reset-password`, () =>
        errorResponse(400, {
          code: 'TOKEN_INVALID',
          message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
        }),
      ),
    );
    renderRoute('/reset-password?token=cu');

    await user.type(await screen.findByLabelText('Mật khẩu mới'), 'mat-khau-moi-123');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'mat-khau-moi-123');
    await user.click(screen.getByRole('button', { name: 'Đặt mật khẩu mới' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('không hợp lệ hoặc đã hết hạn');
    expect(screen.getByRole('link', { name: 'Yêu cầu liên kết mới' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  it('thiếu token → báo lỗi, không hiện form', async () => {
    renderRoute('/reset-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('Thiếu liên kết đặt lại mật khẩu');
    expect(screen.queryByLabelText('Mật khẩu mới')).toBeNull();
  });
});

describe('[bai-08] Đổi mật khẩu (trang Bảo mật)', () => {
  async function fillChangeForm(user, currentPassword = 'mat-khau-cu') {
    await user.type(await screen.findByLabelText('Mật khẩu hiện tại'), currentPassword);
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'mat-khau-moi-123');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'mat-khau-moi-123');
    await user.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
  }

  it('thành công → thông báo, xoá trắng form, vẫn đăng nhập', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch(`${API_URL}/users/me/password`, () =>
        HttpResponse.json({
          success: true,
          message: 'Đổi mật khẩu thành công. Các thiết bị khác đã bị đăng xuất',
          data: null,
        }),
      ),
    );
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/security');

    await fillChangeForm(user);

    expect(await screen.findByText(/Đổi mật khẩu thành công/)).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveValue('');
    expect(useAuthStore.getState().accessToken).not.toBeNull();
  });

  it('sai mật khẩu hiện tại (400, không phải 401) → lỗi ngay tại ô, không đăng xuất', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch(`${API_URL}/users/me/password`, () =>
        errorResponse(400, {
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Mật khẩu hiện tại không đúng',
          details: [{ field: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' }],
        }),
      ),
    );
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/security');

    await fillChangeForm(user, 'sai-roi');

    expect(await screen.findByText('Mật khẩu hiện tại không đúng')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu hiện tại')).toHaveAttribute('aria-invalid', 'true');
    expect(useAuthStore.getState().accessToken).not.toBeNull();
  });
});
