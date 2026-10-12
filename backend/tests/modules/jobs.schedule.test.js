import { describe, expect, it } from 'vitest';
import {
  computeFirstRun,
  computeNextRunAfter,
  getZonedParts,
  zonedTimeToUtc,
} from '../../src/modules/jobs/jobs.schedule.js';

const VN = 'Asia/Ho_Chi_Minh'; // UTC+7, không có giờ mùa hè
const NEW_YORK = 'America/New_York'; // có giờ mùa hè (đổi 8/3/2026 và 1/11/2026)

const daily3am = { kind: 'INTERVAL', everyDays: 1, time: '03:00' };

describe('[bai-14] Chuyển giờ địa phương ↔ UTC', () => {
  it('03:00 ngày 29/9/2026 giờ Việt Nam = 20:00 UTC ngày 28/9', () => {
    const utc = zonedTimeToUtc({ year: 2026, month: 9, day: 29, hour: 3, minute: 0 }, VN);

    expect(utc.toISOString()).toBe('2026-09-28T20:00:00.000Z');
    expect(getZonedParts(utc, VN)).toEqual({ year: 2026, month: 9, day: 29, hour: 3, minute: 0 });
  });

  it('New York: cùng "03:00" nhưng khác độ lệch trước / sau giờ mùa hè', () => {
    expect(
      zonedTimeToUtc({ year: 2026, month: 3, day: 7, hour: 3, minute: 0 }, NEW_YORK).toISOString(),
    ).toBe('2026-03-07T08:00:00.000Z');
    expect(
      zonedTimeToUtc({ year: 2026, month: 3, day: 9, hour: 3, minute: 0 }, NEW_YORK).toISOString(),
    ).toBe('2026-03-09T07:00:00.000Z');
  });
});

describe('[bai-14] computeFirstRun — lần chạy đầu tiên', () => {
  it('ONCE → đúng runAt', () => {
    const runAt = new Date('2026-10-01T02:00:00Z');

    expect(computeFirstRun({ kind: 'ONCE', runAt }, new Date('2026-09-29T00:00:00Z'), VN)).toEqual(
      runAt,
    );
  });

  it('INTERVAL, giờ hôm nay chưa tới → chạy hôm nay', () => {
    // 01:00 giờ VN ngày 29/9 → 03:00 hôm nay chưa tới.
    const now = zonedTimeToUtc({ year: 2026, month: 9, day: 29, hour: 1, minute: 0 }, VN);

    expect(computeFirstRun(daily3am, now, VN)).toEqual(
      zonedTimeToUtc({ year: 2026, month: 9, day: 29, hour: 3, minute: 0 }, VN),
    );
  });

  it('INTERVAL, giờ hôm nay đã qua → ngày mai', () => {
    const now = zonedTimeToUtc({ year: 2026, month: 9, day: 29, hour: 10, minute: 0 }, VN);

    expect(getZonedParts(computeFirstRun(daily3am, now, VN), VN)).toMatchObject({
      day: 30,
      hour: 3,
    });
  });

  it('INTERVAL mỗi 3 ngày neo ở startDate trong quá khứ → mốc kế tiếp đúng chu kỳ', () => {
    const schedule = { kind: 'INTERVAL', everyDays: 3, time: '08:30', startDate: '2026-09-01' };
    const now = zonedTimeToUtc({ year: 2026, month: 9, day: 29, hour: 12, minute: 0 }, VN);

    // 1/9 + 3k: ..., 28/9, 1/10 → 28/9 08:30 đã qua → 1/10 08:30.
    expect(getZonedParts(computeFirstRun(schedule, now, VN), VN)).toEqual({
      year: 2026,
      month: 10,
      day: 1,
      hour: 8,
      minute: 30,
    });
  });
});

describe('[bai-14] computeNextRunAfter — lần kế tiếp sau khi chạy', () => {
  it('ONCE → null (không chạy lại)', () => {
    expect(computeNextRunAfter({ kind: 'ONCE' }, new Date(), new Date(), VN)).toBeNull();
  });

  it('neo theo mốc đã lên lịch, không theo lúc chạy thực tế (chạy trễ 5 phút không làm trôi giờ)', () => {
    const scheduledAt = zonedTimeToUtc({ year: 2026, month: 9, day: 29, hour: 3, minute: 0 }, VN);
    const ranAt = new Date(scheduledAt.getTime() + 5 * 60 * 1000);

    expect(getZonedParts(computeNextRunAfter(daily3am, scheduledAt, ranAt, VN), VN)).toMatchObject({
      day: 30,
      hour: 3,
      minute: 0,
    });
  });

  it('server ngủ 5 ngày → chỉ chạy bù 1 lần, lần kế tiếp là mốc đầu tiên trong tương lai', () => {
    const scheduledAt = zonedTimeToUtc({ year: 2026, month: 9, day: 20, hour: 3, minute: 0 }, VN);
    const now = zonedTimeToUtc({ year: 2026, month: 9, day: 25, hour: 9, minute: 0 }, VN);

    expect(getZonedParts(computeNextRunAfter(daily3am, scheduledAt, now, VN), VN)).toMatchObject({
      day: 26,
      hour: 3,
    });
  });

  it('qua ngày đổi giờ mùa hè: vẫn đúng 03:00 giờ địa phương', () => {
    const scheduledAt = zonedTimeToUtc(
      { year: 2026, month: 3, day: 7, hour: 3, minute: 0 },
      NEW_YORK,
    );
    const now = new Date(scheduledAt.getTime() + 60 * 1000);

    const next = computeNextRunAfter({ ...daily3am, everyDays: 2 }, scheduledAt, now, NEW_YORK);

    expect(getZonedParts(next, NEW_YORK)).toMatchObject({ month: 3, day: 9, hour: 3, minute: 0 });
    // Chỉ cách 47 giờ thực vì mất 1 giờ khi chuyển sang giờ mùa hè.
    expect((next - scheduledAt) / 3_600_000).toBe(47);
  });
});
