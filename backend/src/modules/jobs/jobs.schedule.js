// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 14.
/**
 * Tính lịch chạy job KHÔNG dùng thư viện cron — hàm thuần, dễ unit test.
 * Lịch INTERVAL "mỗi N ngày lúc HH:mm" hiểu theo múi giờ cấu hình (không phải giờ UTC của
 * server); đổi giữa giờ địa phương ↔ UTC bằng Intl (xử lý đúng cả múi giờ có giờ mùa hè).
 */

import { notImplemented } from '../../shared/errors/notImplemented.js';

export const SCHEDULE_KINDS = Object.freeze({ ONCE: 'ONCE', INTERVAL: 'INTERVAL' });

const MINUTE_MS = 60 * 1000;

/**
 * Các thành phần ngày giờ của một thời điểm, nhìn theo múi giờ.
 * @param {Date} date
 * @param {string} timeZone
 * @returns {Object} `{ year, month, day, hour, minute }` (month 1–12)
 */
export function getZonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(date);
  const value = (type) => Number(parts.find((part) => part.type === type).value);
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute'),
  };
}

/**
 * Độ lệch (ms) giữa giờ địa phương và UTC tại một thời điểm.
 * @param {number} timestamp
 * @param {string} timeZone
 * @returns {number}
 */
function getOffsetMs(timestamp, timeZone) {
  const { year, month, day, hour, minute } = getZonedParts(new Date(timestamp), timeZone);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  return asUtc - Math.floor(timestamp / MINUTE_MS) * MINUTE_MS;
}

/**
 * Giờ địa phương (theo múi giờ) → thời điểm UTC. Tính 2 lần để đúng cả khi mốc đó nằm gần lúc
 * chuyển giờ mùa hè.
 * @param {Object} local `{ year, month, day, hour, minute }` (month 1–12; day có thể vượt số
 *   ngày của tháng — Date.UTC tự chuyển sang tháng sau)
 * @param {string} timeZone
 * @returns {Date}
 */
export function zonedTimeToUtc({ year, month, day, hour, minute }, timeZone) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const firstPass = guess - getOffsetMs(guess, timeZone);
  return new Date(guess - getOffsetMs(firstPass, timeZone));
}

/**
 * @param {string} time 'HH:mm'
 * @returns {Object} `{ hour, minute }`
 */
function parseTime(time) {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

/**
 * Lần chạy thứ `stepCount` kể từ mốc neo: cộng theo NGÀY LỊCH địa phương (không cộng 24h) để
 * "lúc 03:00" vẫn là 03:00 kể cả qua ngày chuyển giờ mùa hè.
 * @param {Object} anchor `{ year, month, day }` ngày neo (địa phương)
 * @param {Object} schedule INTERVAL `{ everyDays, time }`
 * @param {number} stepCount
 * @param {string} timeZone
 * @returns {Date}
 */
function occurrenceAt(anchor, schedule, stepCount, timeZone) {
  return zonedTimeToUtc(
    { ...anchor, day: anchor.day + stepCount * schedule.everyDays, ...parseTime(schedule.time) },
    timeZone,
  );
}

/**
 * Lần chạy INTERVAL đầu tiên SAU (hoặc đúng) `notBefore`, đếm từ mốc neo.
 * @param {Object} anchor ngày neo địa phương
 * @param {Object} schedule
 * @param {Date} notBefore
 * @param {string} timeZone
 * @param {boolean} isStrictlyAfter true = phải lớn hơn hẳn notBefore
 * @returns {Date}
 */
function firstOccurrenceFrom(anchor, schedule, notBefore, timeZone, isStrictlyAfter) {
  // Nhảy gần đúng rồi dò từng bước — tránh vòng lặp dài khi mốc neo ở rất xa trong quá khứ.
  const anchorTime = occurrenceAt(anchor, schedule, 0, timeZone).getTime();
  const periodMs = schedule.everyDays * 24 * 60 * MINUTE_MS;
  let step = Math.max(0, Math.floor((notBefore.getTime() - anchorTime) / periodMs) - 1);
  let candidate = occurrenceAt(anchor, schedule, step, timeZone);
  const isTooEarly = (date) =>
    isStrictlyAfter ? date.getTime() <= notBefore.getTime() : date.getTime() < notBefore.getTime();

  while (isTooEarly(candidate)) {
    step += 1;
    candidate = occurrenceAt(anchor, schedule, step, timeZone);
  }
  return candidate;
}

/**
 * Lần chạy đầu tiên khi tạo / sửa job.
 * - ONCE: đúng `runAt`.
 * - INTERVAL: neo ở `startDate` (mặc định hôm nay theo múi giờ) lúc `time`; đã qua thì lấy lần kế tiếp.
 * @param {Object} schedule
 * @param {Date} now
 * @param {string} timeZone
 * @returns {Date}
 */
export function computeFirstRun(schedule, now, timeZone) {
  if (schedule.kind === SCHEDULE_KINDS.ONCE) return new Date(schedule.runAt);

  const anchor = schedule.startDate
    ? Object.fromEntries(
        ['year', 'month', 'day'].map((key, index) => [
          key,
          Number(schedule.startDate.split('-')[index]),
        ]),
      )
    : getZonedParts(now, timeZone);
  return firstOccurrenceFrom(anchor, schedule, now, timeZone, false);
}

/**
 * **[BÀI 14]** Lần chạy kế tiếp, tính **sau khi** vừa chạy xong mốc `scheduledAt`.
 *
 * Các bước:
 * 1. `schedule.kind === SCHEDULE_KINDS.ONCE` → trả `null` (không chạy lại nữa).
 * 2. `anchor = getZonedParts(scheduledAt, timeZone)` — **neo ở mốc ĐÃ LÊN LỊCH**, không phải lúc
 *    chạy thực tế.
 * 3. `next = occurrenceAt(anchor, schedule, 1, timeZone)`; `next` còn ở tương lai → trả nó.
 * 4. Ngược lại (server đã ngủ qua nhiều mốc) → `firstOccurrenceFrom(anchor, schedule, now,
 *    timeZone, true)` — mốc đầu tiên **sau** `now`.
 *
 * ⚠️ **Neo theo mốc đã lên lịch, không theo `now`.** Job hẹn 03:00 nhưng bộ chạy quét mỗi phút
 * nên thực tế chạy lúc 03:00:42. Nếu tính mốc kế tiếp từ *lúc chạy*, mỗi ngày job trôi thêm vài
 * chục giây — sau vài tháng nó chạy vào giữa trưa. Có test: _"neo theo mốc đã lên lịch, không
 * theo lúc chạy thực tế (chạy trễ 5 phút không làm trôi giờ)"_.
 *
 * ⚠️ **Ngủ lâu chỉ chạy bù MỘT lần.** Server tắt 5 ngày rồi bật lại: job đã lỡ 5 mốc. Bước 4 bỏ
 * qua toàn bộ mốc quá khứ và hẹn mốc tương lai gần nhất — thay vì chạy dồn 5 lần liên tiếp (gửi
 * 5 email giống nhau, xoá dữ liệu 5 lượt).
 *
 * @param {Object} schedule
 * @param {Date} scheduledAt mốc của lần vừa chạy
 * @param {Date} now
 * @param {string} timeZone
 * @returns {Date|null}
 * @throws {AppError} 501 khi chưa làm
 */
export function computeNextRunAfter(schedule, scheduledAt, now, timeZone) {
  return notImplemented('bai-14');
}
