/** Hằng số public của module users — module khác import từ đây, không import model. */

export const USER_ROLES = Object.freeze({
  MEMBER: 'MEMBER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
});

/** Vai trò được vào khu quản trị. */
export const ADMIN_ROLES = Object.freeze([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]);

export const USER_NAME_MAX_LENGTH = 100;

/** Trạng thái suy ra (không lưu DB) — dùng để lọc và hiển thị. */
export const USER_STATUSES = Object.freeze({
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
  UNVERIFIED: 'UNVERIFIED',
});
