// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 02.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { useRegister } from '@/features/auth/hooks/useRegister';
import { SETTING_KEYS, usePublicSetting } from '@/features/settings';
import { PASSWORD_MIN_LENGTH, registerSchema } from '@/features/auth/schemas/auth.schemas';
import { Alert } from '@/shared/components/ui/Alert';
import { Button } from '@/shared/components/ui/Button';
import { FormError } from '@/shared/components/ui/FormError';
import { PasswordField } from '@/shared/components/ui/PasswordField';
import { TextField } from '@/shared/components/ui/TextField';
import { TextLink } from '@/shared/components/ui/TextLink';
import { ROUTES } from '@/shared/constants/routes';
import { applyServerErrors } from '@/shared/lib/form';
import { notImplemented } from '@/shared/lib/practice';

const FIELD_NAMES = ['name', 'email', 'password'];

export function RegisterForm() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const isRegistrationEnabled = usePublicSetting(SETTING_KEYS.REGISTRATION_ENABLED);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  /**
   * **[BÀI 02]** Xử lý submit. `handleSubmit` chỉ gọi hàm này khi Zod đã hợp lệ, nên ở đây không
   * cần kiểm tra gì thêm.
   *
   * TODO(bai-02):
   * 1. Gọi `registerMutation.mutate({ name, email, password }, { onSuccess, onError })`.
   *    Gửi đúng 3 trường — **không** gửi `confirmPassword` lên server.
   * 2. `onSuccess`: điều hướng sang `ROUTES.AUTH.CHECK_EMAIL` kèm query `?email=<email vừa nhập>`
   *    (dùng `new URLSearchParams({ email })` và `navigate`) để trang đó điền sẵn ô email.
   * 3. `onError`: `applyServerErrors(error, setError, FIELD_NAMES)` — gắn lỗi theo trường vào
   *    đúng ô, lỗi không theo trường (vd. bị giới hạn request) thành lỗi chung của form.
   */
  const onSubmit = ({ name, email, password }) => {
    registerMutation.mutate(
      { name, email, password },
      {
        onSuccess: () => {
          const params = new URLSearchParams({ email });
          navigate(`${ROUTES.AUTH.CHECK_EMAIL}?${params}`);
        },
        onError: (error) => {
          applyServerErrors(error, setError, FIELD_NAMES);
        },
      },
    );
  };

  if (isRegistrationEnabled === false) {
    return (
      <div className="space-y-4">
        <Alert tone="warning" role="status">
          Hệ thống đang tạm dừng đăng ký tài khoản mới.
        </Alert>
        <p className="text-sm">
          <TextLink to={ROUTES.AUTH.LOGIN}>Về trang đăng nhập</TextLink>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormError message={errors.root?.server?.message} />
      <TextField
        label="Họ tên"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Mật khẩu"
        autoComplete="new-password"
        hint={`Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`}
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
        label="Nhập lại mật khẩu"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
        Đăng ký
      </Button>
      <p className="text-center text-sm text-fg-muted">
        Đã có tài khoản? <TextLink to={ROUTES.AUTH.LOGIN}>Đăng nhập</TextLink>
      </p>
    </form>
  );
}
