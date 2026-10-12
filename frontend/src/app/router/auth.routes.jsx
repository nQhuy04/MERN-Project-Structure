import { GuestOnly } from '@/app/router/guards/GuestOnly';
import { AuthLayout } from '@/layouts/AuthLayout';
import { CheckEmailPage } from '@/pages/auth/CheckEmailPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { MagicLinkPage } from '@/pages/auth/MagicLinkPage';
import { OAuthCallbackPage } from '@/pages/auth/OAuthCallbackPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { ROUTES } from '@/shared/constants/routes';

/** Nhóm route đăng ký / đăng nhập / xác thực (khung AuthLayout). `handle.crumb` = tiêu đề tab. */
export function createAuthRoutes() {
  return [
    {
      Component: AuthLayout,
      children: [
        {
          // Đã đăng nhập thì không vào lại trang đăng nhập/đăng ký.
          Component: GuestOnly,
          children: [
            { path: ROUTES.AUTH.LOGIN, Component: LoginPage, handle: { crumb: 'Đăng nhập' } },
            { path: ROUTES.AUTH.REGISTER, Component: RegisterPage, handle: { crumb: 'Đăng ký' } },
            {
              path: ROUTES.AUTH.FORGOT_PASSWORD,
              Component: ForgotPasswordPage,
              handle: { crumb: 'Quên mật khẩu' },
            },
          ],
        },
        // Link trong email phải mở được dù đang đăng nhập hay không.
        {
          path: ROUTES.AUTH.CHECK_EMAIL,
          Component: CheckEmailPage,
          handle: { crumb: 'Kiểm tra email' },
        },
        {
          path: ROUTES.AUTH.VERIFY_EMAIL,
          Component: VerifyEmailPage,
          handle: { crumb: 'Xác thực email' },
        },
        {
          path: ROUTES.AUTH.RESET_PASSWORD,
          Component: ResetPasswordPage,
          handle: { crumb: 'Đặt mật khẩu mới' },
        },
        {
          path: ROUTES.AUTH.MAGIC_LINK,
          Component: MagicLinkPage,
          handle: { crumb: 'Đăng nhập bằng liên kết' },
        },
        {
          path: ROUTES.AUTH.OAUTH_CALLBACK,
          Component: OAuthCallbackPage,
          handle: { crumb: 'Đăng nhập bằng Google' },
        },
      ],
    },
  ];
}
