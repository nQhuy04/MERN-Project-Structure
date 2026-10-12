import { StrictMode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { AppProviders } from '@/app/providers';
import { useAuthStore } from '@/features/auth';
import { createAppRoutes } from '@/app/router';

/** QueryClient mới cho mỗi test: không cache chéo giữa các test, không retry. */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/**
 * Render với đúng provider của app (QueryClient riêng, Toaster) trong StrictMode như bản chạy thật.
 * @param {Object} ui React element
 * @param {Object} [client] QueryClient riêng — dùng khi test cần đọc / cấu hình cache
 */
export function renderWithProviders(ui, client = createTestQueryClient()) {
  return render(
    <StrictMode>
      <AppProviders client={client}>{ui}</AppProviders>
    </StrictMode>,
  );
}

/**
 * Render toàn bộ cây route của app tại một đường dẫn.
 * @param {string} path
 * @param {Object} [client] QueryClient riêng — xem `renderWithProviders`
 * @returns {Object} kết quả render kèm `router` để kiểm tra điều hướng
 */
export function renderRoute(path, client) {
  const router = createMemoryRouter(createAppRoutes(), { initialEntries: [path] });
  return { ...renderWithProviders(<RouterProvider router={router} />, client), router };
}

export const TEST_USERS = Object.freeze({
  MEMBER: { id: 'u-member', email: 'member@example.com', name: 'Thành Viên', role: 'MEMBER' },
  ADMIN: { id: 'u-admin', email: 'admin@example.com', name: 'Quản Trị', role: 'ADMIN' },
  SUPER_ADMIN: {
    id: 'u-root',
    email: 'root@example.com',
    name: 'Siêu Quản Trị',
    role: 'SUPER_ADMIN',
  },
});

/**
 * Giả lập đã đăng nhập (đặt phiên thẳng vào store).
 * @param {Object} user
 */
export function signInAs(user) {
  useAuthStore.getState().setSession({ accessToken: `token-${user.id}`, user });
}

/**
 * Mở menu thao tác (nút ⋯ / menu tài khoản) rồi chọn một mục. Menu render qua portal nên mục
 * được tìm trên toàn trang.
 * @param {Object} user kết quả `userEvent.setup()`
 * @param {Object} options
 * @param {string|RegExp} options.menu tên nút mở menu
 * @param {string|RegExp} options.item tên mục cần chọn
 * @param {Object} [options.scope=screen] vùng tìm nút mở (vd. `within(row)`)
 */
export async function selectMenuItem(user, { menu, item, scope = screen }) {
  await user.click(await scope.findByRole('button', { name: menu }));
  await user.click(screen.getByRole('menuitem', { name: item }));
}
