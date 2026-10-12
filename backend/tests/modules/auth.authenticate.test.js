import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { User } from '../../src/modules/users/users.model.js';
import { signIn } from '../helpers/auth.js';
import { createUser } from '../helpers/factories.js';

const ME_URL = '/api/v1/users/me';

function getMe(authHeader) {
  const req = request(app).get(ME_URL);
  return authHeader ? req.set('Authorization', authHeader) : req;
}

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
});

describe('[bai-05] authenticate — bảo vệ route bằng access token', () => {
  it('token hợp lệ → vào được, trả user hiện tại (không lộ passwordHash)', async () => {
    const user = await createUser({ name: 'Nguyễn An' });
    const { authHeader } = await signIn(user);

    const res = await getMe(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: String(user._id), name: 'Nguyễn An' });
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it.each([
    ['không có header', undefined],
    ['sai kiểu header', 'Basic abc'],
    ['token rác', 'Bearer abc.def.ghi'],
  ])('%s → 401 AUTH_TOKEN_INVALID', async (_label, authHeader) => {
    const res = await getMe(authHeader);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
  });

  it('token ký bằng secret khác → 401 AUTH_TOKEN_INVALID', async () => {
    const user = await createUser();
    const { session } = await signIn(user);
    const forged = jwt.sign({ sid: String(session._id) }, 'secret-cua-ke-gian-dai-hon-32-ky-tu', {
      subject: String(user._id),
    });

    const res = await getMe(`Bearer ${forged}`);

    expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
  });

  it('token hết hạn → 401 AUTH_TOKEN_EXPIRED (frontend sẽ refresh)', async () => {
    const user = await createUser();
    const { session } = await signIn(user);
    const expired = jwt.sign(
      { sid: String(session._id), exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_ACCESS_SECRET,
      { subject: String(user._id) },
    );

    const res = await getMe(`Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_TOKEN_EXPIRED');
  });

  it('phiên bị thu hồi (xoá session) → token còn hạn cũng hết tác dụng ngay', async () => {
    const user = await createUser();
    const { authHeader, session } = await signIn(user);
    await Session.deleteOne({ _id: session._id });

    const res = await getMe(authHeader);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
  });

  it('phiên quá hạn (chưa bị TTL dọn) → 401', async () => {
    const user = await createUser();
    const { authHeader, session } = await signIn(user);
    await Session.updateOne(
      { _id: session._id },
      { $set: { expiresAt: new Date(Date.now() - 1) } },
    );

    expect((await getMe(authHeader)).status).toBe(401);
  });

  it('user bị xoá → 401; user bị khoá → 403 ACCOUNT_LOCKED ngay ở request kế tiếp', async () => {
    const deleted = await createUser();
    const deletedSession = await signIn(deleted);
    await User.deleteOne({ _id: deleted._id });

    const locked = await createUser();
    const lockedSession = await signIn(locked);
    await User.updateOne({ _id: locked._id }, { $set: { lockedAt: new Date() } });

    expect((await getMe(deletedSession.authHeader)).status).toBe(401);
    const lockedRes = await getMe(lockedSession.authHeader);
    expect(lockedRes.status).toBe(403);
    expect(lockedRes.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  it('session của user khác không dùng được (sub và sid phải khớp)', async () => {
    const owner = await createUser();
    const attacker = await createUser();
    const { session } = await signIn(owner);
    const mixed = jwt.sign({ sid: String(session._id) }, process.env.JWT_ACCESS_SECRET, {
      subject: String(attacker._id),
      expiresIn: 60,
    });

    expect((await getMe(`Bearer ${mixed}`)).status).toBe(401);
  });

  it('role đọc từ DB mỗi request: đổi role có hiệu lực ngay, không chờ token mới', async () => {
    const user = await createUser();
    const { authHeader } = await signIn(user);
    await User.updateOne({ _id: user._id }, { $set: { role: 'ADMIN' } });

    const res = await getMe(authHeader);

    expect(res.body.data.role).toBe('ADMIN');
  });
});
