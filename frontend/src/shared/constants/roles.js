/** Vai trò người dùng — khớp với backend (modules/users/users.constants.js). */
export const USER_ROLES = Object.freeze({
  MEMBER: 'MEMBER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
});

/** Vai trò được vào khu quản trị. */
export const ADMIN_ROLES = Object.freeze([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);

export const ROLE_LABELS = Object.freeze({
  MEMBER: 'Thành viên',
  ADMIN: 'Quản trị viên',
  SUPER_ADMIN: 'Quản trị cấp cao',
});
