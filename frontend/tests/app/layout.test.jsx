import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { API_URL } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute, signInAs } from '../utils';

function mockEmptyUserList() {
  const requests = [];
  server.use(
    http.get(`${API_URL}/admin/users`, ({ request }) => {
      requests.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json({
        success: true,
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    }),
  );
  return requests;
}

describe('[bai-01] Khung trang quản trị', () => {
  it('breadcrumb + tiêu đề tab lấy từ route; topbar có menu tài khoản như người dùng thường', async () => {
    const user = userEvent.setup();
    mockEmptyUserList();
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/users');

    const breadcrumb = await screen.findByRole('navigation', { name: 'Breadcrumb' });
    expect(within(breadcrumb).getByRole('link', { name: 'Quản trị' })).toHaveAttribute(
      'href',
      '/admin',
    );
    expect(within(breadcrumb).getByText('Người dùng')).toHaveAttribute('aria-current', 'page');
    await waitFor(() => expect(document.title).toBe('Người dùng · MERN Base'));

    await user.click(screen.getByRole('button', { name: /Quản Trị/ }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Hồ sơ cá nhân' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Đăng xuất' })).toBeInTheDocument();
  });

  it('mobile: nút mở menu → ngăn kéo có menu quản trị; Escape đóng', async () => {
    const user = userEvent.setup();
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/users');
    mockEmptyUserList();

    const toggle = await screen.findByRole('button', { name: 'Mở menu quản trị' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('navigation', { name: 'Menu quản trị' })).toHaveLength(2);

    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('[bai-11] Bộ lọc người dùng', () => {
  it('ô tìm kiếm tự áp dụng khi ngừng gõ (không cần nút "Tìm")', async () => {
    const user = userEvent.setup();
    const requests = mockEmptyUserList();
    signInAs(TEST_USERS.ADMIN);
    const { router } = renderRoute('/admin/users');

    await user.type(await screen.findByLabelText('Tên hoặc email'), 'chi');

    await waitFor(() => expect(router.state.location.search).toBe('?q=chi'));
    await waitFor(() => expect(requests.at(-1)).toMatchObject({ q: 'chi' }));
  });
});

describe('[bai-01] Khu tài khoản', () => {
  it('/account chuyển tới Hồ sơ; menu con đánh dấu trang hiện tại; breadcrumb đủ cấp', async () => {
    signInAs(TEST_USERS.MEMBER);
    const { router } = renderRoute('/account');

    await screen.findByRole('heading', { level: 1, name: 'Hồ sơ cá nhân' });
    expect(router.state.location.pathname).toBe('/account/profile');
    const accountNav = screen.getByRole('navigation', { name: 'Trang tài khoản' });
    expect(within(accountNav).getByRole('link', { name: 'Hồ sơ cá nhân' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toHaveTextContent('Trang chủTài khoảnHồ sơ cá nhân');
  });
});

describe('[bai-01] Ô mật khẩu', () => {
  it('nút con mắt ẩn / hiện mật khẩu (có nhãn cho trình đọc màn hình)', async () => {
    const user = userEvent.setup();
    renderRoute('/login');

    const input = await screen.findByLabelText('Mật khẩu', { selector: 'input' });
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ẩn mật khẩu' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
