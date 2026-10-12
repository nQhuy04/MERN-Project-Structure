import { ERROR_CODES } from '@/shared/constants/errorCodes';

/**
 * Lỗi đã chuẩn hoá từ mọi lần gọi API. Component/hook chỉ làm việc với dạng này,
 * rẽ nhánh theo `code`, không đọc trực tiếp lỗi của axios.
 */
export class ApiError extends Error {
  /**
   * @param {Object} options
   * @param {number} options.status HTTP status (0 khi không có response)
   * @param {string} options.code mã trong ERROR_CODES
   * @param {string} options.message thông điệp tiếng Việt hiển thị được cho người dùng
   * @param {ErrorDetail[]} [options.details] lỗi theo trường (map vào form bằng setError)
   * @param {Error} [options.cause] lỗi gốc để debug
   */
  constructor({ status, code, message, details = [], cause }) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /**
   * Chuyển lỗi axios về ApiError theo định dạng lỗi chuẩn của backend.
   * @param {Error} error lỗi axios
   * @returns {ApiError}
   */
  static fromAxiosError(error) {
    const { response } = error;
    const body = response?.data;

    if (body?.success === false && body.error) {
      return new ApiError({ status: response.status, ...body.error, cause: error });
    }
    if (response) {
      return new ApiError({
        status: response.status,
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: 'Máy chủ trả về phản hồi không hợp lệ',
        cause: error,
      });
    }
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({
        status: 0,
        code: ERROR_CODES.TIMEOUT,
        message: 'Máy chủ phản hồi quá lâu, vui lòng thử lại',
        cause: error,
      });
    }
    return new ApiError({
      status: 0,
      code: ERROR_CODES.NETWORK_ERROR,
      message: 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.',
      cause: error,
    });
  }
}
