import { verifyEmail } from '@/features/auth/api/auth.api';
import { useConsumeTokenOnce } from '@/features/auth/hooks/useConsumeTokenOnce';

/**
 * Xác thực email bằng token trong link — tự gọi đúng 1 lần khi trang mở.
 * @param {string|null} token
 */
export function useVerifyEmail(token) {
  return useConsumeTokenOnce(verifyEmail, token);
}
