// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 03.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useResendVerification } from '@/features/auth/hooks/useResendVerification';
import { emailSchema } from '@/features/auth/schemas/auth.schemas';
import { Button } from '@/shared/components/ui/Button';
import { FormError } from '@/shared/components/ui/FormError';
import { TextField } from '@/shared/components/ui/TextField';
import { applyServerErrors } from '@/shared/lib/form';
import { notImplemented } from '@/shared/lib/practice';
import { z } from '@/shared/lib/zod';

const resendSchema = z.object({ email: emailSchema });

/**
 * Form gửi lại email xác thực.
 * @param {Object} props
 * @param {string} [props.defaultEmail] email điền sẵn (vd. vừa đăng ký)
 */
export function ResendVerificationForm({ defaultEmail = '' }) {
  const resendMutation = useResendVerification();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resendSchema), defaultValues: { email: defaultEmail } });

  /**
   * **[BÀI 03]** TODO(bai-03): gọi `resendMutation.mutate(values, { onSuccess, onError })`.
   * - `onSuccess`: hiện `toast.success(body.message)` — dùng **thông điệp của server** chứ không
   *   tự viết, vì server cố tình trả cùng một câu dù email có tồn tại hay không.
   * - `onError`: `applyServerErrors(error, setError, ['email'])`.
   */
  const onSubmit = (values) => {
    notImplemented('bai-03');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      <FormError message={errors.root?.server?.message} />
      <TextField
        label="Email đã đăng ký"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Button type="submit" variant="secondary" isLoading={resendMutation.isPending}>
        Gửi lại email xác thực
      </Button>
    </form>
  );
}
