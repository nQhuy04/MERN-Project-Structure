import { afterEach, describe, expect, it, vi } from 'vitest';
import { emailService } from '../../src/modules/email/email.service.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { User } from '../../src/modules/users/users.model.js';
import { usersAdminService } from '../../src/modules/users/usersAdmin.service.js';
import { mailer } from '../../src/shared/lib/mailer.js';
import { signIn } from '../helpers/auth.js';
import { createUser } from '../helpers/factories.js';

/**
 * Test gọi THẲNG service: quy tắc phân quyền chi tiết (lớp 2) phải đúng kể cả khi route quên
 * chặn — không phụ thuộc vào middleware authorize.
 */

/** @param {string} role @returns {Promise} `{ user, actor }` với actor = dạng req.auth */
async function createActor(role) {
  const user = await createUser({ role });
  return { user, actor: { userId: String(user._id), role } };
}

/** Super Admin là duy nhất (partial unique index) → mỗi test tạo lại sau khi dọn DB. */
afterEach(async () => {
  vi.restoreAllMocks();
  await mailer.waitForPending();
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
});

describe('[bai-11] usersAdminService — ma trận quyền khoá / mở khoá', () => {
  it.each([
    ['ADMIN', 'MEMBER', true],
    ['ADMIN', 'ADMIN', false],
    ['SUPER_ADMIN', 'MEMBER', true],
    ['SUPER_ADMIN', 'ADMIN', true],
  ])('%s khoá %s → được phép: %s', async (actorRole, targetRole, isAllowed) => {
    const { actor } = await createActor(actorRole);
    const target = await createUser({ role: targetRole });

    const attempt = usersAdminService.lock(actor, String(target._id));

    if (isAllowed) {
      await expect(attempt).resolves.toMatchObject({ lockedAt: expect.any(Date) });
    } else {
      await expect(attempt).rejects.toMatchObject({
        statusCode: 403,
        code: 'INSUFFICIENT_PERMISSION',
      });
      expect((await User.findById(target._id)).lockedAt).toBeNull();
    }
  });

  it.each(['ADMIN', 'SUPER_ADMIN'])('%s không khoá được Super Admin', async (actorRole) => {
    const superAdmin =
      actorRole === 'SUPER_ADMIN' ? null : await createUser({ role: 'SUPER_ADMIN' });
    const { actor, user } = await createActor(actorRole);
    const targetId = String(superAdmin?._id ?? user._id);

    // Super Admin tự khoá mình rơi vào quy tắc "không tự thao tác" trước.
    const expectedCode = superAdmin ? 'CANNOT_MODIFY_SUPER_ADMIN' : 'CANNOT_MODIFY_SELF';
    await expect(usersAdminService.lock(actor, targetId)).rejects.toMatchObject({
      statusCode: 403,
      code: expectedCode,
    });
  });

  it('không tự khoá chính mình', async () => {
    const { actor, user } = await createActor('ADMIN');

    await expect(usersAdminService.lock(actor, String(user._id))).rejects.toMatchObject({
      code: 'CANNOT_MODIFY_SELF',
    });
  });

  it('khoá → thu hồi MỌI phiên của người bị khoá + gửi email; mở khoá → gửi email', async () => {
    const { actor } = await createActor('ADMIN');
    const target = await createUser();
    await signIn(target);
    await signIn(target);
    const lockedSpy = vi.spyOn(emailService, 'sendAccountLockedEmail');
    const unlockedSpy = vi.spyOn(emailService, 'sendAccountUnlockedEmail');

    await usersAdminService.lock(actor, String(target._id));
    expect(await Session.countDocuments({ userId: target._id })).toBe(0);
    expect(lockedSpy).toHaveBeenCalledOnce();

    const unlocked = await usersAdminService.unlock(actor, String(target._id));
    expect(unlocked.lockedAt).toBeNull();
    expect(unlockedSpy).toHaveBeenCalledOnce();
  });

  it('khoá người đã bị khoá → không đổi gì, không gửi email lần nữa', async () => {
    const { actor } = await createActor('ADMIN');
    const target = await createUser({ lockedAt: new Date('2026-01-01') });
    const lockedSpy = vi.spyOn(emailService, 'sendAccountLockedEmail');

    const result = await usersAdminService.lock(actor, String(target._id));

    expect(result.lockedAt).toEqual(new Date('2026-01-01'));
    expect(lockedSpy).not.toHaveBeenCalled();
  });

  it('user không tồn tại → 404', async () => {
    const { actor } = await createActor('ADMIN');

    await expect(usersAdminService.lock(actor, '65f1a2b3c4d5e6f7a8b9c0d1')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe('[bai-11] usersAdminService — đổi vai trò', () => {
  it('Super Admin nâng MEMBER → ADMIN và hạ ADMIN → MEMBER, gửi email', async () => {
    const { actor } = await createActor('SUPER_ADMIN');
    const member = await createUser();
    const spy = vi.spyOn(emailService, 'sendRoleChangedEmail');

    const promoted = await usersAdminService.changeRole(actor, String(member._id), 'ADMIN');
    expect(promoted.role).toBe('ADMIN');
    const demoted = await usersAdminService.changeRole(actor, String(member._id), 'MEMBER');
    expect(demoted.role).toBe('MEMBER');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('ADMIN không đổi được vai trò của ai', async () => {
    const { actor } = await createActor('ADMIN');
    const member = await createUser();

    await expect(
      usersAdminService.changeRole(actor, String(member._id), 'ADMIN'),
    ).rejects.toMatchObject({ statusCode: 403, code: 'INSUFFICIENT_PERMISSION' });
  });

  it('không ai gán được SUPER_ADMIN (kể cả gọi thẳng service)', async () => {
    const { actor } = await createActor('SUPER_ADMIN');
    const member = await createUser();

    await expect(
      usersAdminService.changeRole(actor, String(member._id), 'SUPER_ADMIN'),
    ).rejects.toMatchObject({ code: 'CANNOT_MODIFY_SUPER_ADMIN' });
    expect((await User.findById(member._id)).role).toBe('MEMBER');
  });

  it('role của đối tượng vừa bị đổi bởi người khác (race) → 409, không ghi đè', async () => {
    const { actor } = await createActor('SUPER_ADMIN');
    const member = await createUser();
    const realFindById = User.findById.bind(User);
    // Giả lập: lúc kiểm tra quyền vẫn là MEMBER, nhưng ngay sau đó người khác đã đổi thành ADMIN.
    vi.spyOn(User, 'findById').mockImplementationOnce(async (id) => {
      const snapshot = await realFindById(id);
      await User.updateOne({ _id: id }, { $set: { role: 'ADMIN' } });
      return snapshot;
    });

    await expect(
      usersAdminService.changeRole(actor, String(member._id), 'ADMIN'),
    ).rejects.toMatchObject({ statusCode: 409, code: 'USER_STATE_CHANGED' });
  });
});
