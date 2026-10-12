import { create } from 'zustand';

/**
 * Client state của phiên đăng nhập. Access token chỉ nằm trong BỘ NHỚ (không localStorage —
 * tránh bị script độc đọc qua XSS); tải lại trang thì khôi phục bằng refresh token trong cookie
 * httpOnly (Phase 5).
 *
 * @typedef {Object} AuthState
 * @property {string|null} accessToken
 * @property {Object|null} user user hiện tại (id, email, name, role...)
 */
export const useAuthStore = create((set) => ({
  accessToken: null,
  user: null,
  /** @param {Object} session `{ accessToken, user }` từ API đăng nhập / refresh */
  setSession: ({ accessToken, user }) => set({ accessToken, user }),
  /** @param {Object} user cập nhật thông tin user (vd. sau khi sửa hồ sơ) */
  setUser: (user) => set({ user }),
  clearSession: () => set({ accessToken: null, user: null }),
}));

/** @returns {Object|null} user đang đăng nhập */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}
