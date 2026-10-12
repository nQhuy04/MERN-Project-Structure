// check-conventions: allow-unused-imports — hằng số bên dưới là gợi ý cho bài 07.
import { notImplemented } from '../errors/notImplemented.js';
/**
 * Nhận diện trình duyệt / hệ điều hành / loại thiết bị từ chuỗi User-Agent — đủ để người dùng
 * nhận ra phiên đăng nhập của mình ("Chrome trên Windows"), không cần chính xác tuyệt đối nên
 * tự viết thay vì thêm thư viện. Thứ tự kiểm tra quan trọng: nhiều trình duyệt tự nhận là
 * "Chrome" hoặc "Safari" trong User-Agent.
 */

const BROWSER_RULES = [
  ['Edge', /Edg(e|A|iOS)?\//],
  ['Opera', /OPR\/|Opera/],
  ['Samsung Internet', /SamsungBrowser\//],
  ['Firefox', /Firefox\/|FxiOS\//],
  ['Chrome', /Chrome\/|CriOS\//],
  ['Safari', /Version\/[\d.]+.*Safari\//],
];

const OS_RULES = [
  ['Windows', /Windows NT/],
  ['iOS', /iPhone|iPad|iPod/],
  ['Android', /Android/],
  ['ChromeOS', /CrOS/],
  ['macOS', /Mac OS X|Macintosh/],
  ['Linux', /Linux/],
];

const UNKNOWN = 'Không xác định';

/**
 * **[BÀI 07]** Tìm luật ĐẦU TIÊN khớp chuỗi User-Agent.
 *
 * Các bước: `rules.find(...)` với vị từ kiểm `pattern.test(userAgent)`, lấy phần tử `[0]` (tên)
 * của luật khớp, không có thì trả `UNKNOWN`. Optional chaining + `??` làm gọn được thành một
 * dòng.
 *
 * "Đầu tiên khớp thì thắng" là lý do **thứ tự trong `BROWSER_RULES` quan trọng**: Edge và Opera
 * đều có chuỗi `Chrome/` trong User-Agent của mình, nên chúng phải được kiểm trước Chrome.
 *
 * @param {Array} rules cặp [tên, regex]
 * @param {string} userAgent
 * @returns {string}
 * @throws {AppError} 501 khi chưa làm
 */
function matchRule(rules, userAgent) {
  return notImplemented('bai-07');
}

/**
 * **[BÀI 07]** Đoán loại thiết bị. Trả về một trong `'mobile'`, `'tablet'`, `'desktop'`.
 *
 * Các bước — **kiểm tablet TRƯỚC mobile**:
 * 1. `iPad` hoặc `Tablet` trong chuỗi → `'tablet'`. Ngoài ra, Android **không** kèm `Mobile` cũng
 *    là tablet — Google quy ước máy tính bảng Android bỏ token `Mobile` đi.
 * 2. `Mobi`, `iPhone` hoặc `iPod` → `'mobile'`.
 * 3. Còn lại → `'desktop'`.
 *
 * Đảo thứ tự hai bước đầu thì mọi tablet Android đều bị nhận nhầm thành mobile, vì chuỗi của
 * chúng vẫn chứa `Android`.
 *
 * @param {string} userAgent
 * @returns {string} 'mobile' | 'tablet' | 'desktop'
 * @throws {AppError} 501 khi chưa làm
 */
function detectDeviceType(userAgent) {
  return notImplemented('bai-07');
}

/**
 * **[BÀI 07]** Chuỗi User-Agent → `{ browser, os, deviceType }` để hiển thị trong danh sách
 * phiên đăng nhập.
 *
 * Các bước: chuỗi rỗng → trả `{ browser: UNKNOWN, os: UNKNOWN, deviceType: 'desktop' }` (bản ghi
 * cũ hoặc client không gửi header — vẫn phải hiện được một dòng, không được để vỡ trang). Còn
 * lại: `matchRule` với `BROWSER_RULES`, `matchRule` với `OS_RULES`, và `detectDeviceType`.
 *
 * @param {string} [userAgent]
 * @returns {Object} `{ browser, os, deviceType }`
 * @throws {AppError} 501 khi chưa làm
 */
export function parseUserAgent(userAgent = '') {
  return notImplemented('bai-07');
}
