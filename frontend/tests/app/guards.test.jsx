import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TEST_USERS, renderRoute, selectMenuItem, signInAs } from '../utils';

describe('[bai-05] Route guard', () => {
  it('ProtectedRoute: chưa đăng nhập → về /login kèm ?redirect= trang đang mở', async () => {
    const { router } = renderRoute('/account/profile?tab=1');

    await screen.findByRole('heading', { name: 'Đăng nhập' });
    expect(router.state.location.pathname).toBe('/login');
    expect(new URLSearchParams(router.state.location.search).get('redirect')).toBe(
      '/account/profile?tab=1',
    );
  });

  it('GuestOnly: đã đăng nhập mà mở /login hoặc /register → vào dashboard', async () => {
    signInAs(TEST_USERS.MEMBER);
    const { router } = renderRoute('/register');

    await screen.findByRole('heading', { name: 'Trang của tôi' });
    expect(router.state.location.pathname).toBe('/dashboard');
  });

  it('RoleGuard: MEMBER mở khu quản trị → trang 403', async () => {
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/admin');

    expect(
      await screen.findByRole('heading', { name: 'Bạn không có quyền truy cập trang này' }),
    ).toBeInTheDocument();
  });

  it('chưa đăng nhập mở khu quản trị → về đăng nhập (không lộ trang 403)', async () => {
    const { router } = renderRoute('/admin');

    await screen.findByRole('heading', { name: 'Đăng nhập' });
    expect(router.state.location.pathname).toBe('/login');
  });
});

describe('[bai-05] Menu người dùng', () => {
  it('MEMBER: có Hồ sơ, không có Quản trị; ADMIN: có Quản trị', async () => {
    const user = userEvent.setup();
    signInAs(TEST_USERS.MEMBER);
    const { unmount } = renderRoute('/dashboard');

    await user.click(await screen.findByRole('button', { name: /Thành Viên/ }));
    const memberMenu = screen.getByRole('menu', { name: /Thành Viên/ });
    expect(within(memberMenu).getByRole('menuitem', { name: 'Hồ sơ cá nhân' })).toBeInTheDocument();
    expect(within(memberMenu).queryByRole('menuitem', { name: 'Quản trị' })).toBeNull();
    unmount();

    signInAs(TEST_USERS.ADMIN);
    renderRoute('/dashboard');
    await user.click(await screen.findByRole('button', { name: /Quản Trị/ }));
    const adminMenu = screen.getByRole('menu', { name: /Quản Trị/ });
    expect(within(adminMenu).getByRole('menuitem', { name: 'Quản trị' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });

  it('nhấn Escape → đóng menu', async () => {
    const user = userEvent.setup();
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/dashboard');
    const toggle = await screen.findByRole('button', { name: /Thành Viên/ });

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

// Nút Đăng xuất nằm trong menu của bài 05, nhưng hành vi đăng xuất là của bài 06.
describe('[bai-06] Đăng xuất từ menu người dùng', () => {
  it('Đăng xuất → xoá phiên, về trang đăng nhập', async () => {
    const user = userEvent.setup();
    signInAs(TEST_USERS.MEMBER);
    const { router } = renderRoute('/dashboard');

    await selectMenuItem(user, { menu: /Thành Viên/, item: 'Đăng xuất' });

    await screen.findByRole('heading', { name: 'Đăng nhập' });
    expect(router.state.location.pathname).toBe('/login');
  });
});
