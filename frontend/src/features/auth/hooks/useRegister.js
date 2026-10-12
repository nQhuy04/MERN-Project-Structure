import { useMutation } from '@tanstack/react-query';
import { register } from '@/features/auth/api/auth.api';

/** Đăng ký tài khoản. */
export function useRegister() {
  return useMutation({ mutationFn: register });
}
