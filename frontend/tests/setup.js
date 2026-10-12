import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { toast } from 'sonner';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { server } from './msw/server';

// Route admin tải lười: lần import đầu trong môi trường test có thể quá 1 giây mặc định.
configure({ asyncUtilTimeout: 3000 });

// Request không có handler → test fail, tránh vô tình gọi mạng thật.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  cleanup();
  // Spy của test trước (vd. window.location) không được rò sang test sau.
  vi.restoreAllMocks();
  // Phiên đăng nhập là state toàn cục (Zustand) → xoá để test sau bắt đầu sạch.
  useAuthStore.getState().clearSession();
  // Sonner giữ hàng đợi toast toàn cục → toast của test trước không được hiện ở test sau.
  toast.dismiss();
});

afterAll(() => server.close());
