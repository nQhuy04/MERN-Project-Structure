import { describe, expect, it } from 'vitest';
import {
  MAX_PASSWORD_BYTES,
  getPasswordByteLength,
  hashPassword,
  verifyPassword,
} from '../../src/shared/utils/password.js';

describe('[bai-02] utils/password', () => {
  it('hash bằng bcrypt với cost từ env, verify đúng/sai', async () => {
    const passwordHash = await hashPassword('mat-khau-an-toan');

    expect(passwordHash).toMatch(/^\$2b\$10\$/);
    expect(await verifyPassword('mat-khau-an-toan', passwordHash)).toBe(true);
    expect(await verifyPassword('mat-khau-sai', passwordHash)).toBe(false);
  });

  it('đếm theo byte UTF-8: ký tự tiếng Việt có dấu chiếm nhiều byte', () => {
    expect(getPasswordByteLength('abc')).toBe(3);
    expect(getPasswordByteLength('mật')).toBe(5);
  });

  it('từ chối mật khẩu vượt 72 byte thay vì để bcrypt cắt bớt im lặng', async () => {
    const tooLong = 'ệ'.repeat(25); // 75 byte

    expect(getPasswordByteLength(tooLong)).toBeGreaterThan(MAX_PASSWORD_BYTES);
    await expect(hashPassword(tooLong)).rejects.toThrow(/72 byte/);
  });
});
