// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 05.
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCurrentUser } from '@/features/auth';
import { useUpdateProfile } from '@/features/account/hooks/useUpdateProfile';
import { profileSchema } from '@/features/account/schemas';
import { Button } from '@/shared/components/ui/Button';
import { FormError } from '@/shared/components/ui/FormError';
import { TextField } from '@/shared/components/ui/TextField';
import { ROLE_LABELS } from '@/shared/constants/roles';
import { applyServerErrors } from '@/shared/lib/form';
import { notImplemented } from '@/shared/lib/practice';

/** Form sửa hồ sơ của chính mình (tên). Email và vai trò chỉ hiển thị. */
export function ProfileForm() {
  const currentUser = useCurrentUser();
  const updateMutation = useUpdateProfile();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(profileSchema), values: { name: currentUser.name } });

  /**
   * **[BÀI 05]** TODO(bai-05): `updateMutation.mutate(values, { onSuccess, onError })` —
   * `onSuccess` hiện `toast.success(body.message)`, `onError` gọi
   * `applyServerErrors(error, setError, ['name'])`.
   */
  const onSubmit = (values) => {
    notImplemented('bai-05');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-md space-y-4">
      <FormError message={errors.root?.server?.message} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-fg-muted">Email</dt>
        <dd>{currentUser.email}</dd>
        <dt className="text-fg-muted">Vai trò</dt>
        <dd>{ROLE_LABELS[currentUser.role]}</dd>
      </dl>
      <TextField
        label="Họ tên"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <Button type="submit" isLoading={updateMutation.isPending} disabled={!isDirty}>
        Lưu thay đổi
      </Button>
    </form>
  );
}
