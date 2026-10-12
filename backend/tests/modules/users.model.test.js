import { afterEach, describe, expect, it } from 'vitest';
import { USER_ROLES, User } from '../../src/modules/users/users.model.js';

function buildUser(overrides = {}) {
  return { email: 'an@example.com', name: 'Nguyễn An', passwordHash: 'hash', ...overrides };
}

describe('[bai-02] User model', () => {
  afterEach(async () => {
    await User.deleteMany({});
  });

  it('JSON trả ra có id, không có _id, __v, passwordHash', async () => {
    const user = await User.create(buildUser());

    const json = user.toJSON();

    expect(json.id).toBe(String(user._id));
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
    expect(json).not.toHaveProperty('passwordHash');
  });

  it('không đọc passwordHash khi query trừ khi chọn rõ', async () => {
    await User.create(buildUser());

    expect((await User.findOne({ email: 'an@example.com' })).passwordHash).toBeUndefined();
    expect(
      (await User.findOne({ email: 'an@example.com' }).select('+passwordHash')).passwordHash,
    ).toBe('hash');
  });

  it('mặc định: MEMBER, chưa kích hoạt, không bị khoá; email chuẩn hoá lowercase + trim', async () => {
    const user = await User.create(buildUser({ email: '  An@Example.COM ' }));

    expect(user).toMatchObject({
      email: 'an@example.com',
      role: USER_ROLES.MEMBER,
      emailVerifiedAt: null,
      lockedAt: null,
      avatarMediaId: null,
    });
  });

  it('thiếu email/tên hoặc role lạ → lỗi validation có thông điệp tiếng Việt', async () => {
    const error = await User.create({ role: 'ROOT' }).catch((err) => err);

    expect(error.errors.email.message).toBe('Email là bắt buộc');
    expect(error.errors.name.message).toBe('Tên là bắt buộc');
    expect(error.errors.role.message).toBe('Vai trò không hợp lệ');
  });

  it('email trùng bị chặn ở tầng DB (index unique)', async () => {
    await User.create(buildUser());

    await expect(User.create(buildUser({ email: 'AN@example.com' }))).rejects.toMatchObject({
      code: 11000,
      keyPattern: { email: 1 },
    });
  });

  it('chỉ có đúng 1 SUPER_ADMIN (partial unique index)', async () => {
    await User.create(buildUser({ role: USER_ROLES.SUPER_ADMIN }));

    await expect(
      User.create(buildUser({ email: 'khac@example.com', role: USER_ROLES.SUPER_ADMIN })),
    ).rejects.toMatchObject({ code: 11000, keyPattern: { role: 1 } });
  });

  it('nhiều user không có googleId vẫn hợp lệ; googleId trùng bị chặn', async () => {
    await User.create(buildUser());
    await User.create(buildUser({ email: 'binh@example.com' }));
    await User.create(buildUser({ email: 'chi@example.com', googleId: 'google-1' }));

    await expect(
      User.create(buildUser({ email: 'dung@example.com', googleId: 'google-1' })),
    ).rejects.toMatchObject({ code: 11000, keyPattern: { googleId: 1 } });
  });
});
