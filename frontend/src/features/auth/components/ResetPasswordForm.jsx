// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 08.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'react-router';
import { useResetPassword } from '@/features/auth/hooks/usePasswordMutations';
import { PASSWORD_MIN_LENGTH, newPasswordSchema } from '@/features/auth/schemas/auth.schemas';
import { Alert } from '@/shared/components/ui/Alert';
import { Button, ButtonLink } from '@/shared/components/ui/Button';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { FormError } from '@/shared/components/ui/FormError';
import { PasswordField } from '@/shared/components/ui/PasswordField';
import { TextLink } from '@/shared/components/ui/TextLink';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { ROUTES } from '@/shared/constants/routes';
import { applyServerErrors } from '@/shared/lib/form';
import { notImplemented } from '@/shared/lib/practice';

/** Đặt mật khẩu mới bằng token trong link email (người dùng tự bấm gửi — không gọi tự động). */
export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const resetMutation = useResetPassword();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <ErrorState
        title="Thiếu liên kết đặt lại mật khẩu"
        message="Hãy mở đúng liên kết trong email, hoặc yêu cầu liên kết mới."
      />
    );
  }

  if (resetMutation.isSuccess) {
    return (
      <div className="space-y-4">
        <Alert tone="success" role="status">
          {resetMutation.data.message}
        </Alert>
        <ButtonLink to={ROUTES.AUTH.LOGIN} className="w-full">
          Đăng nhập
        </ButtonLink>
      </div>
    );
  }

  /**
   * **[BÀI 08]** TODO(bai-08): `resetMutation.mutate({ token, password }, { onError })`.
   *
   * `token` lấy từ query string của URL (đã đọc sẵn ở đầu component), `password` từ form —
   * **không** gửi `confirmPassword` lên server.
   */
  const onSubmit = ({ password }) => {
    notImplemented('bai-08');
  };

  const isTokenInvalid = resetMutation.error?.code === ERROR_CODES.TOKEN_INVALID;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormError message={errors.root?.server?.message} />
      {isTokenInvalid && (
        <p className="text-sm">
          <TextLink to={ROUTES.AUTH.FORGOT_PASSWORD}>Yêu cầu liên kết mới</TextLink>
        </p>
      )}
      <PasswordField
        label="Mật khẩu mới"
        autoComplete="new-password"
        hint={`Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`}
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" className="w-full" isLoading={resetMutation.isPending}>
        Đặt mật khẩu mới
      </Button>
    </form>
  );
}
