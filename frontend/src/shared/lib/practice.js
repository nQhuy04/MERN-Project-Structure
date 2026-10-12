import { toast } from 'sonner';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { ApiError } from './apiError';

/** Tên file đề bài trong `docs/practice/`, theo mã bài. */
const LESSONS = Object.freeze({
  'bai-02': 'bai-02-dang-ky-tai-khoan',
  'bai-03': 'bai-03-email-va-xac-thuc-tai-khoan',
  'bai-04': 'bai-04-dang-nhap',
  'bai-05': 'bai-05-bao-ve-route-va-phan-quyen',
  'bai-06': 'bai-06-refresh-token-va-dang-xuat',
  'bai-07': 'bai-07-quan-ly-phien-dang-nhap',
  'bai-08': 'bai-08-quen-dat-lai-doi-mat-khau',
  'bai-09': 'bai-09-system-settings-va-magic-link',
  'bai-10': 'bai-10-google-oauth',
  'bai-11': 'bai-11-quan-ly-nguoi-dung-va-phan-quyen',
  'bai-12': 'bai-12-storage-r2',
  'bai-13': 'bai-13-media-he-thong-va-anh-dai-dien',
  'bai-14': 'bai-14-lich-tu-dong-va-thong-ke',
  'bai-15': 'bai-15-gui-email-qua-smtp',
});

/**
 * Đánh dấu phần code người học phải tự viết (chỉ có trên nhánh `practice`).
 *
 * Ném đúng loại lỗi mà mọi lời gọi API trả về (`ApiError`), nên `getErrorMessage` và toast hiển
 * thị được bình thường thay vì trang bị vỡ. Thay cả dòng bằng code thật của bạn.
 *
 * QUAN TRỌNG: chỉ gọi trong hàm chạy khi người dùng thao tác (gọi API, submit form). Hàm chạy
 * lúc render (tính quyền hiển thị, đọc lỗi để hiện thông báo) phải trả giá trị mặc định an toàn
 * (`false`, `[]`, `null`) kèm `// TODO(bai-XX)` — nếu ném lỗi thì cả trang không render được.
 *
 * @param {string} lesson mã bài, vd. `'bai-02'`
 * @returns {void} không bao giờ trả về — luôn ném lỗi
 * @throws {ApiError} 501 NOT_IMPLEMENTED
 */
export function notImplemented(lesson) {
  throw new ApiError({
    status: 501,
    code: ERROR_CODES.NOT_IMPLEMENTED,
    message: `Chức năng chưa được hoàn thành — xem docs/practice (${lesson})`,
  });
}

/**
 * Câu hướng dẫn cho lỗi NOT_IMPLEMENTED: mã bài lấy từ thông điệp (frontend lẫn backend đều ghi
 * `(bai-XX)`), đổi thành đường dẫn file đề bài.
 * @param {Error} error
 * @returns {Object|null} `{ lesson, description }`; `null` nếu không phải lỗi chưa làm
 */
export function describeNotImplemented(error) {
  if (error?.code !== ERROR_CODES.NOT_IMPLEMENTED) return null;

  const lesson = error.message?.match(/bai-\d{2}/)?.[0] ?? null;
  const file = LESSONS[lesson];
  const description = file
    ? `Vui lòng xem docs/practice/${file}.md`
    : 'Vui lòng xem danh sách bài trong docs/practice/README.md';
  return { lesson, description };
}

/**
 * Hiện toast khi người dùng chạm vào tính năng chưa làm. Bắt ở những nơi lỗi có thể "lặng lẽ"
 * biến mất: query lỗi, mutation lỗi, lỗi ném trong handler đồng bộ (`onClick`) và trong handler
 * async (`handleSubmit` của React Hook Form ném lại lỗi thành promise không ai bắt). Mỗi bài chỉ
 * một toast một lúc (`id` theo mã bài).
 *
 * Làm xong bài thì không còn lỗi NOT_IMPLEMENTED nào → hàm này tự im lặng, không cần gỡ.
 *
 * @param {Object} client QueryClient
 * @returns {Function} huỷ đăng ký
 */
export function watchNotImplemented(client) {
  const notify = (error) => {
    const notice = describeNotImplemented(error);
    if (!notice) return;
    toast.warning('Tính năng chưa được thực hiện', {
      id: `not-implemented-${notice.lesson ?? 'unknown'}`,
      description: notice.description,
    });
  };
  const onCacheEvent = (event) => {
    if (event.type === 'updated' && event.action?.type === 'error') notify(event.action.error);
  };
  const onUnhandledRejection = (event) => notify(event.reason);
  const onUncaughtError = (event) => notify(event.error);

  const unsubscribeQueries = client.getQueryCache().subscribe(onCacheEvent);
  const unsubscribeMutations = client.getMutationCache().subscribe(onCacheEvent);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
  window.addEventListener('error', onUncaughtError);

  return () => {
    unsubscribeQueries();
    unsubscribeMutations();
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    window.removeEventListener('error', onUncaughtError);
  };
}
