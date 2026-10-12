// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 08.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForgotPassword } from '@/features/auth/hooks/usePasswordMutations';
import { forgotPasswordSchema } from '@/features/auth/schemas/auth.schemas';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { FormError } from '@/shared/components/ui/FormError';
import { TextField } from '@/shared/components/ui/TextField';
import { TextLink } from '@/shared/components/ui/TextLink';
import { ROUTES } from '@/shared/constants/routes';
import { applyServerErrors } from '@/shared/lib/form';
import { notImplemented } from '@/shared/lib/practice';

export function ForgotPasswordForm() {
  const forgotMutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  /**
   * **[BÀI 08]** TODO(bai-08): `forgotMutation.mutate(values, { onError })` với `onError` là
   * `applyServerErrors(error, setError, ['email'])`.
   *
   * Không cần `onSuccess`: khi `forgotMutation.isSuccess`, component trả về màn hình thông báo
   * (đoạn ngay bên dưới) và hiện **thông điệp của server** — thông điệp đó cố tình giống nhau dù
   * email có tồn tại hay không.
   */
  const onSubmit = (values) => {
    notImplemented('bai-08');
  };

  if (forgotMutation.isSuccess) {
    return (
      <div className="space-y-4">
        <Alert tone="success" role="status">
          {forgotMutation.data.message}. Liên kết có hiệu lực trong 60 phút.
        </Alert>
        <p className="text-sm">
          <TextLink to={ROUTES.AUTH.LOGIN}>Quay lại đăng nhập</TextLink>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormError message={errors.root?.server?.message} />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" className="w-full" isLoading={forgotMutation.isPending}>
        Gửi liên kết
      </Button>
      <p className="text-center text-sm">
        <TextLink to={ROUTES.AUTH.LOGIN}>Quay lại đăng nhập</TextLink>
      </p>
    </form>
  );
}
