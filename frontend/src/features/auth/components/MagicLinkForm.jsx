// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 09.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRequestMagicLink } from '@/features/auth/hooks/useMagicLink';
import { forgotPasswordSchema } from '@/features/auth/schemas/auth.schemas';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { FormError } from '@/shared/components/ui/FormError';
import { TextField } from '@/shared/components/ui/TextField';
import { applyServerErrors } from '@/shared/lib/form';
import { notImplemented } from '@/shared/lib/practice';

/** Nhập email để nhận liên kết đăng nhập không cần mật khẩu. */
export function MagicLinkForm() {
  const magicLinkMutation = useRequestMagicLink();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  if (magicLinkMutation.isSuccess) {
    return (
      <Alert tone="success" role="status">
        {magicLinkMutation.data.message}. Liên kết có hiệu lực trong 15 phút.
      </Alert>
    );
  }

  /**
   * **[BÀI 09]** TODO(bai-09): `magicLinkMutation.mutate(values, { onError })` với `onError` là
   * `applyServerErrors(error, setError, ['email'])`. Giống `ForgotPasswordForm` của bài 08.
   */
  const onSubmit = (values) => {
    notImplemented('bai-09');
  };

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
      <Button type="submit" className="w-full" isLoading={magicLinkMutation.isPending}>
        Gửi liên kết đăng nhập
      </Button>
    </form>
  );
}
