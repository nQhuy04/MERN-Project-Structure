import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { User } from '../../src/modules/users/users.model.js';
import { mailer } from '../../src/shared/lib/mailer.js';
import { signIn } from '../helpers/auth.js';
import { createUser } from '../helpers/factories.js';

const USERS_URL = '/api/v1/admin/users';

async function signInAs(role) {
  const user = await createUser({ role, name: `Người ${role}` });
  return (await signIn(user)).authHeader;
}

afterEach(async () => {
  await mailer.waitForPending();
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
});

describe('[bai-11] GET /admin/users — danh sách người dùng', () => {
  it('MEMBER → 403; chưa đăng nhập → 401', async () => {
    const memberHeader = await signInAs('MEMBER');

    expect((await request(app).get(USERS_URL).set('Authorization', memberHeader)).status).toBe(403);
    expect((await request(app).get(USERS_URL)).status).toBe(401);
  });

  it('phân trang theo định dạng chuẩn, trả id + trạng thái suy ra, không lộ trường nhạy cảm', async () => {
    const adminHeader = await signInAs('ADMIN');
    for (let i = 0; i < 3; i += 1) await createUser({ name: `Thành viên ${i}` });

    const res = await request(app)
      .get(USERS_URL)
      .query({ page: 1, limit: 2 })
      .set('Authorization', adminHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 4, totalPages: 2 });
    expect(res.body.data).toHaveLength(2);
    for (const user of res.body.data) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('status');
      expect(user).not.toHaveProperty('_id');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('googleId');
    }
  });

  it('tìm theo tên/email (không phân biệt hoa thường), lọc role + trạng thái', async () => {
    const adminHeader = await signInAs('ADMIN');
    await createUser({ name: 'Trần Bình', email: 'binh@example.com' });
    await createUser({ name: 'Lê Chi', email: 'chi@example.com', lockedAt: new Date() });
    await createUser({ name: 'Phạm Dũng', emailVerifiedAt: null });

    const search = await request(app)
      .get(USERS_URL)
      .query({ q: 'BINH' })
      .set('Authorization', adminHeader);
    const locked = await request(app)
      .get(USERS_URL)
      .query({ status: 'LOCKED' })
      .set('Authorization', adminHeader);
    const unverified = await request(app)
      .get(USERS_URL)
      .query({ status: 'UNVERIFIED', role: 'MEMBER' })
      .set('Authorization', adminHeader);

    expect(search.body.data.map((user) => user.name)).toEqual(['Trần Bình']);
    expect(locked.body.data.map((user) => [user.name, user.status])).toEqual([
      ['Lê Chi', 'LOCKED'],
    ]);
    expect(unverified.body.data.map((user) => user.name)).toEqual(['Phạm Dũng']);
  });

  it('ký tự đặc biệt trong từ khoá được escape (".*" không khớp mọi người)', async () => {
    const adminHeader = await signInAs('ADMIN');
    await createUser({ name: 'An' });

    const res = await request(app)
      .get(USERS_URL)
      .query({ q: '.*' })
      .set('Authorization', adminHeader);

    expect(res.body.data).toEqual([]);
  });

  it('tham số lọc rỗng = không lọc; limit > 100, sort ngoài whitelist → 400', async () => {
    const adminHeader = await signInAs('ADMIN');

    const empty = await request(app)
      .get(USERS_URL)
      .query({ q: '', role: '', status: '' })
      .set('Authorization', adminHeader);
    expect(empty.status).toBe(200);

    // (Express 5 dùng query parser "simple": `role[$ne]=x` không thành object lồng → không có
    // operator injection qua query string; Zod vẫn là lớp chặn chính.)
    for (const query of [{ limit: 101 }, { sort: 'passwordHash' }, { role: 'ROOT' }]) {
      const res = await request(app).get(USERS_URL).query(query).set('Authorization', adminHeader);
      expect(res.status).toBe(400);
    }
  });

  it('sắp xếp theo tên', async () => {
    const adminHeader = await signInAs('SUPER_ADMIN');
    await createUser({ name: 'Bình' });
    await createUser({ name: 'An' });

    const res = await request(app)
      .get(USERS_URL)
      .query({ sort: 'name', role: 'MEMBER' })
      .set('Authorization', adminHeader);

    expect(res.body.data.map((user) => user.name)).toEqual(['An', 'Bình']);
  });
});

describe('[bai-11] PATCH /admin/users/:id/lock | unlock | role', () => {
  it('ADMIN khoá MEMBER → người đó bị đăng xuất ngay', async () => {
    const adminHeader = await signInAs('ADMIN');
    const member = await createUser();
    const memberSession = await signIn(member);

    const res = await request(app)
      .patch(`${USERS_URL}/${member._id}/lock`)
      .set('Authorization', adminHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.lockedAt).toBeTruthy();
    const me = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', memberSession.authHeader);
    expect(me.status).toBe(401);
  });

  it('ADMIN khoá ADMIN khác → 403 INSUFFICIENT_PERMISSION', async () => {
    const adminHeader = await signInAs('ADMIN');
    const otherAdmin = await createUser({ role: 'ADMIN' });

    const res = await request(app)
      .patch(`${USERS_URL}/${otherAdmin._id}/lock`)
      .set('Authorization', adminHeader);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSION');
  });

  it('đổi vai trò: ADMIN bị chặn ở route (403 FORBIDDEN); SUPER_ADMIN được; gán SUPER_ADMIN → 400', async () => {
    const adminHeader = await signInAs('ADMIN');
    const superHeader = await signInAs('SUPER_ADMIN');
    const member = await createUser();
    const url = `${USERS_URL}/${member._id}/role`;

    const byAdmin = await request(app)
      .patch(url)
      .set('Authorization', adminHeader)
      .send({ role: 'ADMIN' });
    expect(byAdmin.status).toBe(403);
    expect(byAdmin.body.error.code).toBe('FORBIDDEN');

    const bySuper = await request(app)
      .patch(url)
      .set('Authorization', superHeader)
      .send({ role: 'ADMIN' });
    expect(bySuper.body.data.role).toBe('ADMIN');

    const toSuper = await request(app)
      .patch(url)
      .set('Authorization', superHeader)
      .send({ role: 'SUPER_ADMIN' });
    expect(toSuper.status).toBe(400);
  });

  it('id sai định dạng → 400; không có API xoá user', async () => {
    const adminHeader = await signInAs('SUPER_ADMIN');
    const member = await createUser();

    expect(
      (await request(app).patch(`${USERS_URL}/abc/lock`).set('Authorization', adminHeader)).status,
    ).toBe(400);
    expect(
      (await request(app).delete(`${USERS_URL}/${member._id}`).set('Authorization', adminHeader))
        .status,
    ).toBe(404);
  });
});
