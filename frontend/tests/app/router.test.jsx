import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TEST_USERS, renderRoute, signInAs } from '../utils';

describe('[bai-01] Router', () => {
  it('đường dẫn không tồn tại → trang 404 có link về trang chủ', async () => {
    renderRoute('/khong-ton-tai');

    expect(
      await screen.findByRole('heading', { name: 'Không tìm thấy trang' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
  });

  it('trang chủ nằm trong ClientLayout, có menu chính', async () => {
    renderRoute('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'MERN Base' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Menu chính' })).toBeInTheDocument();
  });

  it('khu quản trị được tải lười và hiển thị trong AdminLayout', async () => {
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin');

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Menu quản trị' })).toBeInTheDocument();
  });
});
