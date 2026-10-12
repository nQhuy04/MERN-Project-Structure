import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { User } from '../../src/modules/users/users.model.js';
import { signIn } from '../helpers/auth.js';
import { createUser } from '../helpers/factories.js';

const ME_URL = '/api/v1/users/me';

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
});

describe('[bai-05] PATCH /users/me — tự cập nhật hồ sơ', () => {
  it('đổi tên (tự trim) → trả user mới', async () => {
    const user = await createUser({ name: 'Tên cũ' });
    const { authHeader } = await signIn(user);

    const res = await request(app)
      .patch(ME_URL)
      .set('Authorization', authHeader)
      .send({ name: '  Tên mới  ' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Cập nhật hồ sơ thành công');
    expect(res.body.data.name).toBe('Tên mới');
  });

  it('không đổi được email, role hay trạng thái qua endpoint này', async () => {
    const user = await createUser({ email: 'an@example.com' });
    const { authHeader } = await signIn(user);

    await request(app)
      .patch(ME_URL)
      .set('Authorization', authHeader)
      .send({ name: 'An', email: 'khac@example.com', role: 'SUPER_ADMIN', lockedAt: null })
      .expect(200);

    expect(await User.findById(user._id)).toMatchObject({
      email: 'an@example.com',
      role: 'MEMBER',
    });
  });

  it('tên rỗng → 400 VALIDATION_ERROR', async () => {
    const user = await createUser();
    const { authHeader } = await signIn(user);

    const res = await request(app)
      .patch(ME_URL)
      .set('Authorization', authHeader)
      .send({ name: ' ' });

    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('name');
  });

  it('chưa đăng nhập → 401', async () => {
    const res = await request(app).patch(ME_URL).send({ name: 'An' });

    expect(res.status).toBe(401);
  });
});
