import { describe, expect, it } from 'vitest';
import { emailSchema, nameSchema, passwordSchema } from '../../src/modules/users/users.schema.js';

describe('[bai-02] users.schema — quy tắc dữ liệu người dùng dùng chung', () => {
  it('email: bỏ khoảng trắng, chuyển chữ thường; sai định dạng bị từ chối', () => {
    expect(emailSchema.parse('  An@Example.COM ')).toBe('an@example.com');
    expect(emailSchema.safeParse('khong-phai-email').success).toBe(false);
    expect(emailSchema.safeParse({ $ne: null }).success).toBe(false);
  });

  it('tên: bắt buộc sau khi trim, tối đa 100 ký tự', () => {
    expect(nameSchema.parse('  Nguyễn An ')).toBe('Nguyễn An');
    expect(nameSchema.safeParse('   ').success).toBe(false);
    expect(nameSchema.safeParse('a'.repeat(101)).success).toBe(false);
  });

  it('mật khẩu: tối thiểu 8 ký tự, tối đa 72 byte UTF-8', () => {
    expect(passwordSchema.safeParse('1234567').success).toBe(false);
    expect(passwordSchema.safeParse('12345678').success).toBe(true);
    expect(passwordSchema.safeParse('a'.repeat(72)).success).toBe(true);
    // 25 ký tự nhưng 75 byte → vượt giới hạn của bcrypt.
    expect(passwordSchema.safeParse('ệ'.repeat(25)).success).toBe(false);
  });
});
