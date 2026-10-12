import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { mapLeanDocument } from '../../src/shared/utils/mongo.js';
import { idParamsSchema } from '../../src/shared/utils/commonSchemas.js';

describe('[bai-01] mapLeanDocument — chuẩn hoá kết quả .lean() về id', () => {
  it('đổi _id thành id (string) và bỏ __v', () => {
    const _id = new mongoose.Types.ObjectId();

    expect(mapLeanDocument({ _id, __v: 0, name: 'An' })).toEqual({ id: String(_id), name: 'An' });
  });

  it('xử lý subdocument, mảng và dữ liệu populate lồng nhau', () => {
    const userId = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();

    const result = mapLeanDocument([
      { _id: userId, items: [{ _id: itemId, qty: 2 }], owner: { _id: userId, __v: 3 } },
    ]);

    expect(result).toEqual([
      {
        id: String(userId),
        items: [{ id: String(itemId), qty: 2 }],
        owner: { id: String(userId) },
      },
    ]);
  });

  it('giữ nguyên Date, ObjectId tham chiếu, null và giá trị nguyên thủy', () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const avatarMediaId = new mongoose.Types.ObjectId();

    const result = mapLeanDocument({ createdAt, avatarMediaId, lockedAt: null, count: 1 });

    expect(result.createdAt).toBe(createdAt);
    expect(result.avatarMediaId).toBe(avatarMediaId);
    expect(result).toMatchObject({ lockedAt: null, count: 1 });
  });
});

describe('[bai-01] idParamsSchema — validate ObjectId ở params', () => {
  it('chấp nhận chuỗi 24 ký tự hex', () => {
    expect(idParamsSchema.safeParse({ id: '65f1a2b3c4d5e6f7a8b9c0d1' }).success).toBe(true);
  });

  it.each(['abc', '65f1a2b3c4d5e6f7a8b9c0dz', { $ne: null }])('từ chối %j', (id) => {
    expect(idParamsSchema.safeParse({ id }).success).toBe(false);
  });
});
