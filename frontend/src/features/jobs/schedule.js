import { formatDateTime } from '@/shared/lib/format';

/**
 * Mô tả lịch dễ đọc: "Mỗi 7 ngày lúc 09:00" / "Một lần lúc 14:30 1/10/2026".
 * @param {Object} schedule
 * @returns {string}
 */
export function describeSchedule(schedule) {
  if (schedule.kind === 'ONCE') return `Một lần lúc ${formatDateTime(schedule.runAt)}`;
  const frequency = schedule.everyDays === 1 ? 'Hằng ngày' : `Mỗi ${schedule.everyDays} ngày`;
  return `${frequency} lúc ${schedule.time}`;
}

/**
 * Date → giá trị cho <input type="datetime-local"> theo giờ máy người dùng.
 * @param {string|Date} value
 * @returns {string} 'YYYY-MM-DDTHH:mm'
 */
export function toDateTimeLocalValue(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
