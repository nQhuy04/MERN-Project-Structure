import { afterEach, describe, expect, it } from 'vitest';
import { USER_ROLES, User } from '../../src/modules/users/users.model.js';
import { usersService } from '../../src/modules/users/users.service.js';
import { verifyPassword } from '../../src/shared/utils/password.js';

const SUPER_ADMIN_INPUT = {
  email: 'root@example.com',
  name: 'Super Admin',
  password: 'mat-khau-root-123',
};

describe('[bai-01] usersService.ensureSuperAdmin — seed Super Admin', () => {
  afterEach(async () => {
    await User.deleteMany({});
  });

  it('chưa có Super Admin → tạo mới, đã kích hoạt, mật khẩu được hash', async () => {
    const { created, user } = await usersService.ensureSuperAdmin(SUPER_ADMIN_INPUT);

    expect(created).toBe(true);
    expect(user).toMatchObject({ email: 'root@example.com', role: USER_ROLES.SUPER_ADMIN });
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);

    const saved = await User.findById(user._id).select('+passwordHash');
    expect(saved.passwordHash).not.toBe(SUPER_ADMIN_INPUT.password);
    expect(await verifyPassword(SUPER_ADMIN_INPUT.password, saved.passwordHash)).toBe(true);
  });

  it('chạy lại → không tạo thêm, trả về Super Admin hiện có', async () => {
    await usersService.ensureSuperAdmin(SUPER_ADMIN_INPUT);

    const { created } = await usersService.ensureSuperAdmin(SUPER_ADMIN_INPUT);

    expect(created).toBe(false);
    expect(await User.countDocuments({ role: USER_ROLES.SUPER_ADMIN })).toBe(1);
  });

  it('đổi email trong env rồi chạy lại → vẫn đúng 1 Super Admin (email cũ)', async () => {
    await usersService.ensureSuperAdmin(SUPER_ADMIN_INPUT);

    const { created, user } = await usersService.ensureSuperAdmin({
      ...SUPER_ADMIN_INPUT,
      email: 'root-moi@example.com',
    });

    expect(created).toBe(false);
    expect(user.email).toBe('root@example.com');
    expect(await User.countDocuments({ role: USER_ROLES.SUPER_ADMIN })).toBe(1);
  });

  it('email đã thuộc về tài khoản khác → 409, không nâng quyền tài khoản đó', async () => {
    await User.create({ email: 'root@example.com', name: 'Thành viên' });

    await expect(usersService.ensureSuperAdmin(SUPER_ADMIN_INPUT)).rejects.toMatchObject({
      statusCode: 409,
      code: 'DUPLICATE_VALUE',
    });
    expect(await User.countDocuments({ role: USER_ROLES.SUPER_ADMIN })).toBe(0);
  });
});
