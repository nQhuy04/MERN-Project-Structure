import { useMutation } from '@tanstack/react-query';
import { resendVerification } from '@/features/auth/api/auth.api';

/** Gửi lại email xác thực. */
export function useResendVerification() {
  return useMutation({ mutationFn: resendVerification });
}
