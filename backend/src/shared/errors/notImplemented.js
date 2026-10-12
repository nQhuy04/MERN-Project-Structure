import { AppError } from './AppError.js';
import { ERROR_CODES } from './errorCodes.js';

/**
 * Đánh dấu phần code người học phải tự viết (chỉ có trên nhánh `practice`).
 *
 * Gọi vào sẽ ném lỗi 501 theo đúng định dạng lỗi chuẩn, nên frontend vẫn hiển thị được thông báo
 * thay vì vỡ trang. Thay cả dòng `return notImplemented('bai-XX')` bằng code thật của bạn.
 *
 * QUAN TRỌNG: chỉ gọi hàm này TRONG thân hàm chạy khi có request. Đừng gọi ở cấp module hoặc
 * trong hàm chạy lúc nạp module (factory middleware, hàm tạo danh sách route, registry) — làm
 * vậy backend sẽ không khởi động được.
 *
 * @param {string} lesson mã bài, vd. `'bai-02'`
 * @returns {void} không bao giờ trả về — luôn ném lỗi
 * @throws {AppError} 501 NOT_IMPLEMENTED
 */
export function notImplemented(lesson) {
  throw new AppError({
    statusCode: 501,
    code: ERROR_CODES.NOT_IMPLEMENTED,
    message: `Chức năng chưa được hoàn thành — xem docs/practice (${lesson})`,
  });
}
