import { useEffect, useRef, useState } from 'react';
import { expireSession, renewSession } from '@/features/auth/session';
import { useAuthStore } from '@/features/auth/store/authStore';
import { PageLoader } from '@/shared/components/ui/PageLoader';

/**
 * Khôi phục phiên khi mở / tải lại app: access token chỉ nằm trong bộ nhớ nên mất khi tải lại —
 * đổi refresh token (cookie httpOnly) lấy access token mới trước khi render route (để guard
 * không đá người dùng về trang đăng nhập oan).
 */
export function SessionRestorer({ children }) {
  const [isRestoring, setIsRestoring] = useState(() => !useAuthStore.getState().accessToken);
  // Strict Mode chạy effect 2 lần ở dev → chỉ gọi refresh 1 lần.
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!isRestoring || hasStartedRef.current) return;
    hasStartedRef.current = true;

    renewSession()
      // Không có phiên hợp lệ = người dùng là khách, không phải lỗi cần báo.
      .catch(expireSession)
      .finally(() => setIsRestoring(false));
  }, [isRestoring]);

  if (isRestoring) return <PageLoader />;

  return children;
}
