// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 04.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { loginSchema } from '@/features/auth/schemas/auth.schemas';
import { Button } from '@/shared/components/ui/Button';
import { FormError } from '@/shared/components/ui/FormError';
import { PasswordField } from '@/shared/components/ui/PasswordField';
import { TextField } from '@/shared/components/ui/TextField';
import { TextLink } from '@/shared/components/ui/TextLink';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { ROUTES } from '@/shared/constants/routes';
import { applyServerErrors } from '@/shared/lib/form';
import { notImplemented } from '@/shared/lib/practice';

const FIELD_NAMES = ['email', 'password'];

export function LoginForm() {
  const loginMutation = useLogin();
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  /**
   * **[BÀI 04]** TODO(bai-04): gọi `loginMutation.mutate(values, { onError })`, với `onError` là
   * `applyServerErrors(error, setError, FIELD_NAMES)`.
   *
   * Không cần `onSuccess`: hook đã lưu phiên, và guard `GuestOnly` (bài 05) tự chuyển tới
   * `?redirect=` hoặc dashboard khi store có user.
   */
  const onSubmit = (values) => {
    notImplemented('bai-04');
  };

  const isEmailNotVerified = loginMutation.error?.code === ERROR_CODES.EMAIL_NOT_VERIFIED;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormError message={errors.root?.server?.message} />
      {isEmailNotVerified && (
        <p className="text-sm text-fg-muted">
          Chưa nhận được email?{' '}
          <TextLink
            to={`${ROUTES.AUTH.CHECK_EMAIL}?${new URLSearchParams({ email: getValues('email') })}`}
          >
            Gửi lại email xác thực
          </TextLink>
        </p>
      )}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className="space-y-1.5">
        <PasswordField
          label="Mật khẩu"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <p className="text-right text-sm">
          <TextLink to={ROUTES.AUTH.FORGOT_PASSWORD}>Quên mật khẩu?</TextLink>
        </p>
      </div>
      <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
        Đăng nhập
      </Button>
    </form>
  );
}
