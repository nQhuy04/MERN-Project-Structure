import { Outlet } from 'react-router';
import { Brand } from '@/layouts/Brand';
import { ROUTES } from '@/shared/constants/routes';

/** Khung trang đăng ký / đăng nhập / xác thực: thẻ giữa màn hình, không có menu chính. */
export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-10 text-fg">
      {/* Nền trang trí nhẹ theo màu thương hiệu. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-primary-soft to-transparent"
      />
      <Brand to={ROUTES.HOME} className="relative mb-8" />
      <main className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
