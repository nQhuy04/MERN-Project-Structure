import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { sessionsService } from '../../src/modules/sessions/sessions.service.js';
import { User } from '../../src/modules/users/users.model.js';
import { signIn } from '../helpers/auth.js';
import { createUser } from '../helpers/factories.js';

const SESSIONS_URL = '/api/v1/sessions';
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
});

describe('[bai-07] GET /sessions — danh sách thiết bị đang đăng nhập', () => {
  it('chỉ phiên của mình, đánh dấu phiên hiện tại, nhận diện thiết bị, không lộ secret', async () => {
    const user = await createUser();
    const other = await createUser();
    const current = await signIn(user);
    await sessionsService.create({ userId: user._id, userAgent: IPHONE_UA, ip: '1.2.3.4' });
    await signIn(other);

    const res = await request(app).get(SESSIONS_URL).set('Authorization', current.authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const currentItem = res.body.data.find((session) => session.isCurrent);
    expect(currentItem.id).toBe(String(current.session._id));
    const phone = res.body.data.find((session) => !session.isCurrent);
    expect(phone).toMatchObject({
      ip: '1.2.3.4',
      device: { browser: 'Safari', os: 'iOS', deviceType: 'mobile' },
    });
    for (const session of res.body.data) {
      expect(session).not.toHaveProperty('_id');
      expect(session).not.toHaveProperty('secretHash');
      expect(session).not.toHaveProperty('previousSecretHash');
    }
  });

  it('chưa đăng nhập → 401', async () => {
    expect((await request(app).get(SESSIONS_URL)).status).toBe(401);
  });
});

describe('[bai-07] DELETE /sessions/:id — thu hồi một thiết bị', () => {
  it('thu hồi phiên khác của mình → phiên đó mất hiệu lực ngay', async () => {
    const user = await createUser();
    const current = await signIn(user);
    const phone = await signIn(user);

    const res = await request(app)
      .delete(`${SESSIONS_URL}/${phone.session._id}`)
      .set('Authorization', current.authHeader);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Đã thu hồi phiên đăng nhập');
    const phoneRequest = await request(app)
      .get(SESSIONS_URL)
      .set('Authorization', phone.authHeader);
    expect(phoneRequest.status).toBe(401);
  });

  it('không thu hồi được phiên hiện tại → 400 CANNOT_REVOKE_CURRENT_SESSION', async () => {
    const user = await createUser();
    const current = await signIn(user);

    const res = await request(app)
      .delete(`${SESSIONS_URL}/${current.session._id}`)
      .set('Authorization', current.authHeader);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_REVOKE_CURRENT_SESSION');
  });

  it('phiên của người khác → 404 (chống IDOR), phiên đó vẫn còn', async () => {
    const user = await createUser();
    const victim = await createUser();
    const current = await signIn(user);
    const victimSession = await signIn(victim);

    const res = await request(app)
      .delete(`${SESSIONS_URL}/${victimSession.session._id}`)
      .set('Authorization', current.authHeader);

    expect(res.status).toBe(404);
    expect(await Session.exists({ _id: victimSession.session._id })).toBeTruthy();
  });

  it('id sai định dạng → 400 VALIDATION_ERROR', async () => {
    const user = await createUser();
    const current = await signIn(user);

    const res = await request(app)
      .delete(`${SESSIONS_URL}/abc`)
      .set('Authorization', current.authHeader);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('[bai-07] DELETE /sessions — đăng xuất mọi thiết bị khác', () => {
  it('thu hồi mọi phiên khác của mình, giữ phiên hiện tại, không đụng phiên người khác', async () => {
    const user = await createUser();
    const other = await createUser();
    const current = await signIn(user);
    await signIn(user);
    await signIn(user);
    const otherSession = await signIn(other);

    const res = await request(app).delete(SESSIONS_URL).set('Authorization', current.authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      message: 'Đã đăng xuất 2 thiết bị khác',
      data: { revokedCount: 2 },
    });
    expect(await Session.countDocuments({ userId: user._id })).toBe(1);
    expect(await Session.exists({ _id: current.session._id })).toBeTruthy();
    expect(await Session.exists({ _id: otherSession.session._id })).toBeTruthy();
  });
});
