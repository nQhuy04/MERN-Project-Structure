/** Đường dẫn trang khai báo tập trung — không gõ chuỗi path rải rác trong component. */
export const ROUTES = Object.freeze({
  HOME: '/',
  DASHBOARD: '/dashboard',
  ACCOUNT: Object.freeze({
    ROOT: '/account',
    PROFILE: '/account/profile',
    FILES: '/account/files',
    SECURITY: '/account/security',
    SESSIONS: '/account/sessions',
  }),
  AUTH: Object.freeze({
    LOGIN: '/login',
    REGISTER: '/register',
    CHECK_EMAIL: '/check-email',
    VERIFY_EMAIL: '/verify-email',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    MAGIC_LINK: '/magic-link',
    OAUTH_CALLBACK: '/auth/callback',
  }),
  ADMIN: Object.freeze({
    ROOT: '/admin',
    USERS: '/admin/users',
    MEDIA: '/admin/media',
    MEDIA_ALL: '/admin/media/all',
    // Dùng với generatePath(ROUTES.ADMIN.MEDIA_FOLDER, { folder }).
    MEDIA_FOLDER: '/admin/media/folders/:folder',
    JOBS: '/admin/jobs',
    SETTINGS: '/admin/settings',
  }),
});
