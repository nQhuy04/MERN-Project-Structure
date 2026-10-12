/** Tên lỗi chung của form trong react-hook-form (hiển thị bằng FormError). */
export const ROOT_ERROR = 'root.server';

/**
 * Đưa lỗi từ API vào form: lỗi theo trường (`error.details`, có ở VALIDATION_ERROR và một số
 * lỗi nghiệp vụ như INVALID_CURRENT_PASSWORD) gắn vào đúng ô; trường không có trong form hoặc
 * lỗi không theo trường → lỗi chung của form.
 * @param {Error} error ApiError
 * @param {Function} setError `setError` của react-hook-form
 * @param {string[]} fieldNames các trường có trong form
 */
export function applyServerErrors(error, setError, fieldNames) {
  const fieldDetails = (error.details ?? []).filter((detail) => fieldNames.includes(detail.field));

  for (const detail of fieldDetails) {
    setError(detail.field, { type: 'server', message: detail.message }, { shouldFocus: true });
  }

  if (fieldDetails.length === 0) {
    setError(ROOT_ERROR, { type: 'server', message: error.message });
  }
}
