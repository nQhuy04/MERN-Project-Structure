// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 08.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useChangePassword } from '@/features/auth/hooks/usePasswordMutations';
import { PASSWORD_MIN_LENGTH, changePasswordSchema } from '@/features/auth/schemas/auth.schemas';
import { Button } from '@/shared/components/ui/Button';
import { FormError } from '@/shared/components/ui/FormError';
import { PasswordField } from '@/shared/components/ui/PasswordField';
import { TextLink } from '@/shared/components/ui/TextLink';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { ROUTES } from '@/shared/constants/routes';
import { applyServerErrors } from '@/shared/lib/form';
import { notImplemented } from '@/shared/lib/practice';

const EMPTY_VALUES = { currentPassword: '', newPassword: '', confirmPassword: '' };
const FIELD_NAMES = ['currentPassword', 'newPassword'];

/** Đổi mật khẩu khi đang đăng nhập. Thành công → các thiết bị khác bị đăng xuất. */
export function ChangePasswordForm() {
  const changeMutation = useChangePassword();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(changePasswordSchema), defaultValues: EMPTY_VALUES });

  /**
   * **[BÀI 08]** TODO(bai-08): `changeMutation.mutate({ currentPassword, newPassword },
   * { onSuccess, onError })`.
   * - `onSuccess`: `toast.success(body.message)` **và** `reset(EMPTY_VALUES)` — xoá trắng form,
   *   không để mật khẩu nằm lại trong ô input sau khi đã đổi xong.
   * - `onError`: `applyServerErrors(error, setError, FIELD_NAMES)` — server trả `details` trỏ
   *   vào `currentPassword`, nên lỗi "mật khẩu hiện tại không đúng" hiện ngay dưới đúng ô.
   */
  const onSubmit = ({ currentPassword, newPassword }) => {
    notImplemented('bai-08');
  };

  const isPasswordNotSet = changeMutation.error?.code === ERROR_CODES.PASSWORD_NOT_SET;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-4">
      <FormError message={errors.root?.server?.message} />
      {isPasswordNotSet && (
        <p className="text-sm text-fg-muted">
          <TextLink to={ROUTES.AUTH.FORGOT_PASSWORD}>Tạo mật khẩu qua email</TextLink>
        </p>
      )}
      <PasswordField
        label="Mật khẩu hiện tại"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <PasswordField
        label="Mật khẩu mới"
        autoComplete="new-password"
        hint={`Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`}
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <PasswordField
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" isLoading={changeMutation.isPending}>
        Đổi mật khẩu
      </Button>
    </form>
  );
}
