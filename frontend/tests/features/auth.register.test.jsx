import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { API_URL } from '../msw/handlers';
import { server } from '../msw/server';
import { renderRoute } from '../utils';

const REGISTER_MESSAGE = 'Vui lòng kiểm tra email để hoàn tất đăng ký';

function errorResponse(status, error) {
  return HttpResponse.json({ success: false, error }, { status });
}

async function fillRegisterForm(user, overrides = {}) {
  const values = {
    name: 'Nguyễn An',
    email: 'an@example.com',
    password: 'mat-khau-an-toan',
    confirmPassword: 'mat-khau-an-toan',
    ...overrides,
  };
  await user.type(await screen.findByLabelText('Họ tên'), values.name);
  await user.type(screen.getByLabelText('Email'), values.email);
  await user.type(screen.getByLabelText('Mật khẩu', { selector: 'input' }), values.password);
  await user.type(screen.getByLabelText('Nhập lại mật khẩu'), values.confirmPassword);
  await user.click(screen.getByRole('button', { name: 'Đăng ký' }));
}

describe('[bai-02] Trang đăng ký', () => {
  it('validate phía client: báo lỗi từng ô, không gọi API', async () => {
    const user = userEvent.setup();
    let requestCount = 0;
    server.use(
      http.post(`${API_URL}/auth/register`, () => {
        requestCount += 1;
        return HttpResponse.json({ success: true, message: REGISTER_MESSAGE, data: null });
      }),
    );
    renderRoute('/register');

    await fillRegisterForm(user, { email: 'sai', password: '123', confirmPassword: '456' });

    expect(await screen.findByText('Email không hợp lệ')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu tối thiểu 8 ký tự')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu nhập lại không khớp')).toBeInTheDocument();
    expect(requestCount).toBe(0);
  });

  it('ô mật khẩu có nút ẩn/hiện', async () => {
    const user = userEvent.setup();
    renderRoute('/register');
    const passwordInput = await screen.findByLabelText('Mật khẩu');

    expect(passwordInput).toHaveAttribute('type', 'password');
    await user.click(screen.getAllByRole('button', { name: 'Hiện mật khẩu' })[0]);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('lỗi theo trường từ server được gắn vào đúng ô', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_URL}/auth/register`, () =>
        errorResponse(400, {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu không hợp lệ',
          details: [{ field: 'email', message: 'Tên miền email không được chấp nhận' }],
        }),
      ),
    );
    renderRoute('/register');

    await fillRegisterForm(user);

    expect(await screen.findByText('Tên miền email không được chấp nhận')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('lỗi không theo trường (bị giới hạn request) → thông báo chung của form', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${API_URL}/auth/register`, () =>
        errorResponse(429, { code: 'RATE_LIMITED', message: 'Bạn thao tác quá nhiều lần' }),
      ),
    );
    renderRoute('/register');

    await fillRegisterForm(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Bạn thao tác quá nhiều lần');
  });

  it('đăng ký thành công → chuyển sang trang "Kiểm tra email" kèm email vừa nhập', async () => {
    const user = userEvent.setup();
    let receivedBody;
    server.use(
      http.post(`${API_URL}/auth/register`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ success: true, message: REGISTER_MESSAGE, data: null });
      }),
    );
    const { router } = renderRoute('/register');

    await fillRegisterForm(user);

    expect(
      await screen.findByRole('heading', { name: 'Kiểm tra email của bạn' }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe('?email=an%40example.com');
    // Không gửi confirmPassword lên server.
    expect(receivedBody).toEqual({
      name: 'Nguyễn An',
      email: 'an@example.com',
      password: 'mat-khau-an-toan',
    });
  });
});

describe('[bai-03] Trang kiểm tra email', () => {
  it('gửi lại email xác thực với email điền sẵn → hiện thông báo', async () => {
    const user = userEvent.setup();
    const message = 'Nếu email thuộc một tài khoản chưa kích hoạt, chúng tôi đã gửi lại liên kết';
    server.use(
      http.post(`${API_URL}/auth/resend-verification`, () =>
        HttpResponse.json({ success: true, message, data: null }),
      ),
    );
    renderRoute('/check-email?email=an%40example.com');

    expect(await screen.findByLabelText('Email đã đăng ký')).toHaveValue('an@example.com');
    await user.click(screen.getByRole('button', { name: 'Gửi lại email xác thực' }));

    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});

describe('[bai-03] Trang xác thực email', () => {
  it('token hợp lệ → gọi API đúng 1 lần (kể cả StrictMode) và báo thành công', async () => {
    let requestCount = 0;
    server.use(
      http.post(`${API_URL}/auth/verify-email`, () => {
        requestCount += 1;
        return HttpResponse.json({ success: true, message: 'ok', data: null });
      }),
    );
    renderRoute('/verify-email?token=abc');

    expect(await screen.findByText(/Xác thực email thành công/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
    await waitFor(() => expect(requestCount).toBe(1));
  });

  it('token sai/hết hạn → thông báo lỗi và chỉ đường gửi lại email', async () => {
    server.use(
      http.post(`${API_URL}/auth/verify-email`, () =>
        errorResponse(400, {
          code: 'TOKEN_INVALID',
          message: 'Liên kết xác thực không hợp lệ hoặc đã hết hạn',
        }),
      ),
    );
    renderRoute('/verify-email?token=abc');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Liên kết xác thực không hợp lệ hoặc đã hết hạn',
    );
    expect(screen.getByRole('link', { name: 'gửi lại email xác thực' })).toHaveAttribute(
      'href',
      '/check-email',
    );
  });

  it('thiếu token trên URL → báo lỗi, không gọi API', async () => {
    renderRoute('/verify-email');

    expect(await screen.findByRole('alert')).toHaveTextContent('Thiếu liên kết xác thực');
  });
});
