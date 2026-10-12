/** Trạng thái suy ra của user — khớp backend (users.constants.js USER_STATUSES). */
export const USER_STATUS_LABELS = Object.freeze({
  ACTIVE: 'Hoạt động',
  LOCKED: 'Bị khoá',
  UNVERIFIED: 'Chưa kích hoạt',
});

/** Khớp whitelist sắp xếp của backend (usersAdmin.schema.js). */
export const USER_SORT_LABELS = Object.freeze({
  '-createdAt': 'Mới tạo trước',
  createdAt: 'Cũ trước',
  name: 'Tên A → Z',
  '-name': 'Tên Z → A',
  '-lastLoginAt': 'Đăng nhập gần đây',
});

export const USER_LIST_DEFAULTS = Object.freeze({
  q: '',
  role: '',
  status: '',
  sort: '-createdAt',
  page: 1,
});
