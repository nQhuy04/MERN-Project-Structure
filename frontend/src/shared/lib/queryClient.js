import { QueryClient } from '@tanstack/react-query';

const MAX_RETRIES = 2;
const DEFAULT_STALE_TIME_MS = 30_000;

/**
 * Chỉ thử lại lỗi tạm thời (mất mạng, timeout, 5xx). Lỗi 4xx là lỗi của request,
 * thử lại cũng cho cùng kết quả.
 * @param {number} failureCount
 * @param {Error} error ApiError
 * @returns {boolean}
 */
function shouldRetry(failureCount, error) {
  const isClientError = error.status >= 400 && error.status < 500;
  return !isClientError && failureCount < MAX_RETRIES;
}

/** QueryClient dùng chung, cấu hình tập trung cho toàn ứng dụng. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME_MS,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
