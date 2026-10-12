import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { SessionRestorer, expireSession, renewSession, useAuthStore } from '@/features/auth';
import { configureHttpAuth } from '@/shared/lib/http';
import { watchNotImplemented } from '@/shared/lib/practice';
import { queryClient } from '@/shared/lib/queryClient';

// Tầng app là nơi duy nhất nối hạ tầng dùng chung (http) với feature (auth).
configureHttpAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshSession: renewSession,
  onSessionExpired: () => {
    if (expireSession()) toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
  },
});

/**
 * Xoá sạch cache server state mỗi khi CHỦ phiên đổi (đăng nhập, hết phiên, người khác đăng nhập
 * trên cùng tab). Không có bước này, người dùng tiếp theo còn đọc được dữ liệu của người trước
 * trong khoảng `staleTime`. Làm token mới cho cùng một người (refresh) không đổi chủ → giữ cache.
 * @param {Object} client QueryClient đang dùng
 */
function useClearCacheOnUserChange(client) {
  useEffect(
    () =>
      useAuthStore.subscribe((state, previousState) => {
        if ((state.user?.id ?? null) !== (previousState.user?.id ?? null)) client.clear();
      }),
    [client],
  );
}

/**
 * Provider dùng chung cho toàn ứng dụng: TanStack Query, toast, khôi phục phiên đăng nhập.
 * @param {Object} props
 * @param {Object} [props.client] QueryClient — mặc định client dùng chung; test truyền client riêng
 */
export function AppProviders({ children, client = queryClient }) {
  useClearCacheOnUserChange(client);
  // Nhánh practice: thao tác vào tính năng chưa làm → toast chỉ tới đề bài thay vì im lặng.
  useEffect(() => watchNotImplemented(client), [client]);

  return (
    <QueryClientProvider client={client}>
      <SessionRestorer>{children}</SessionRestorer>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
