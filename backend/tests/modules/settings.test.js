import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { Setting } from '../../src/modules/settings/settings.model.js';
import { SETTING_KEYS } from '../../src/modules/settings/settings.registry.js';
import { settingsService } from '../../src/modules/settings/settings.service.js';
import { User } from '../../src/modules/users/users.model.js';
import { mailer } from '../../src/shared/lib/mailer.js';
import { signIn } from '../helpers/auth.js';
import { createUser } from '../helpers/factories.js';

const ADMIN_SETTINGS_URL = '/api/v1/admin/settings';

async function signInAs(role) {
  const user = await createUser({ role, name: `${role} thử` });
  return { user, ...(await signIn(user)) };
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all([User.deleteMany({}), Session.deleteMany({}), Setting.deleteMany({})]);
});

describe('[bai-09] settingsService.get — giá trị hiệu lực', () => {
  it('chưa lưu trong DB → giá trị mặc định trong registry', async () => {
    expect(await settingsService.get(SETTING_KEYS.MAGIC_LINK_ENABLED)).toBe(true);
  });

  it('giá trị trong DB sai kiểu (sửa tay) → dùng mặc định, không làm hỏng app', async () => {
    await Setting.create({ key: SETTING_KEYS.MAGIC_LINK_ENABLED, value: 'khong-phai-boolean' });

    expect(await settingsService.get(SETTING_KEYS.MAGIC_LINK_ENABLED)).toBe(true);
  });

  it('key chưa khai báo trong registry → lỗi lập trình', async () => {
    await expect(settingsService.get('khong.ton.tai')).rejects.toThrow(/chưa khai báo/);
  });
});

describe('[bai-09] GET /settings/public — cấu hình công khai', () => {
  it('không cần đăng nhập; trả setting public + cờ tính năng', async () => {
    await Setting.create({ key: SETTING_KEYS.REGISTRATION_ENABLED, value: false });

    const res = await request(app).get('/api/v1/settings/public');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      settings: { 'auth.registrationEnabled': false, 'auth.magicLinkEnabled': true },
      features: { googleOAuth: true, storage: true },
    });
  });
});

describe('[bai-09] /admin/settings — Super Admin quản lý cấu hình', () => {
  it.each(['MEMBER', 'ADMIN'])('%s → 403 FORBIDDEN', async (role) => {
    const { authHeader } = await signInAs(role);

    const res = await request(app).get(ADMIN_SETTINGS_URL).set('Authorization', authHeader);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('GET → danh sách kèm mô tả, giá trị mặc định', async () => {
    const { authHeader } = await signInAs('SUPER_ADMIN');

    const res = await request(app).get(ADMIN_SETTINGS_URL).set('Authorization', authHeader);

    expect(res.body.data).toContainEqual(
      expect.objectContaining({
        key: 'auth.magicLinkEnabled',
        value: true,
        default: true,
        input: 'boolean',
        updatedBy: null,
      }),
    );
  });

  it('PATCH → lưu giá trị, ghi người sửa', async () => {
    const { authHeader, user } = await signInAs('SUPER_ADMIN');

    const res = await request(app)
      .patch(ADMIN_SETTINGS_URL)
      .set('Authorization', authHeader)
      .send({ values: { 'auth.magicLinkEnabled': false } });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Đã lưu cấu hình');
    const saved = res.body.data.find((setting) => setting.key === 'auth.magicLinkEnabled');
    expect(saved).toMatchObject({
      value: false,
      updatedBy: { id: String(user._id), name: 'SUPER_ADMIN thử' },
    });
    expect(await settingsService.get(SETTING_KEYS.MAGIC_LINK_ENABLED)).toBe(false);
  });

  it('sai kiểu, key lạ hoặc rỗng → 400 VALIDATION_ERROR', async () => {
    const { authHeader } = await signInAs('SUPER_ADMIN');

    for (const values of [{ 'auth.magicLinkEnabled': 'yes' }, { 'khong.co': true }, {}]) {
      const res = await request(app)
        .patch(ADMIN_SETTINGS_URL)
        .set('Authorization', authHeader)
        .send({ values });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('cập nhật nhiều setting trong transaction: lỗi giữa chừng → không cái nào được lưu', async () => {
    const { authHeader } = await signInAs('SUPER_ADMIN');
    const originalFindOneAndUpdate = Setting.findOneAndUpdate.bind(Setting);
    let callCount = 0;
    vi.spyOn(Setting, 'findOneAndUpdate').mockImplementation((...args) => {
      callCount += 1;
      if (callCount === 2) throw new Error('DB lỗi ở setting thứ 2');
      return originalFindOneAndUpdate(...args);
    });

    const res = await request(app)
      .patch(ADMIN_SETTINGS_URL)
      .set('Authorization', authHeader)
      .send({ values: { 'auth.registrationEnabled': false, 'auth.magicLinkEnabled': false } });

    expect(res.status).toBe(500);
    expect(await Setting.countDocuments()).toBe(0);
  });
});

describe('[bai-15] Kênh gửi email (setting email.provider)', () => {
  it('GET → kiểu select, mặc định console (test), kênh chưa cấu hình biến môi trường bị khoá', async () => {
    const { authHeader } = await signInAs('SUPER_ADMIN');

    const res = await request(app).get(ADMIN_SETTINGS_URL).set('Authorization', authHeader);

    const setting = res.body.data.find((item) => item.key === 'email.provider');
    expect(setting).toMatchObject({ value: 'console', default: 'console', input: 'select' });
    expect(setting.options).toEqual([
      expect.objectContaining({ value: 'console', disabled: false }),
      expect.objectContaining({ value: 'resend', disabled: true }),
      expect.objectContaining({ value: 'smtp', disabled: false }),
    ]);
  });

  it('setting kiểu boolean có options = null', async () => {
    const { authHeader } = await signInAs('SUPER_ADMIN');

    const res = await request(app).get(ADMIN_SETTINGS_URL).set('Authorization', authHeader);

    const setting = res.body.data.find((item) => item.key === 'auth.magicLinkEnabled');
    expect(setting.options).toBeNull();
  });

  it('PATCH chọn SMTP (đã cấu hình) → lưu; email sau đó đi qua SMTP', async () => {
    const { authHeader } = await signInAs('SUPER_ADMIN');

    const res = await request(app)
      .patch(ADMIN_SETTINGS_URL)
      .set('Authorization', authHeader)
      .send({ values: { 'email.provider': 'smtp' } });

    expect(res.status).toBe(200);
    expect(await settingsService.get(SETTING_KEYS.EMAIL_PROVIDER)).toBe('smtp');
  });

  it('PATCH chọn kênh chưa cấu hình (Resend) hoặc kênh lạ → 400, không lưu', async () => {
    const { authHeader } = await signInAs('SUPER_ADMIN');

    for (const provider of ['resend', 'sendgrid']) {
      const res = await request(app)
        .patch(ADMIN_SETTINGS_URL)
        .set('Authorization', authHeader)
        .send({ values: { 'email.provider': provider } });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect(await Setting.countDocuments()).toBe(0);
  });
});

describe('[bai-15] POST /admin/settings/email-test — gửi email thử', () => {
  const EMAIL_TEST_URL = `${ADMIN_SETTINGS_URL}/email-test`;

  it('gửi tới email của Super Admin qua đúng kênh được chọn, chờ kết quả', async () => {
    const { authHeader, user } = await signInAs('SUPER_ADMIN');
    const deliverSpy = vi.spyOn(mailer, 'deliver').mockResolvedValue();

    const res = await request(app)
      .post(EMAIL_TEST_URL)
      .set('Authorization', authHeader)
      .send({ provider: 'smtp' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(`Đã gửi email thử tới ${user.email}`);
    expect(res.body.data).toEqual({ to: user.email, provider: 'smtp' });
    expect(deliverSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: user.email, provider: 'smtp' }),
    );
  });

  it('nhà cung cấp từ chối → 502 EMAIL_DELIVERY_FAILED kèm lý do', async () => {
    const { authHeader } = await signInAs('SUPER_ADMIN');
    vi.spyOn(mailer, 'deliver').mockRejectedValue(new Error('Invalid login: 535'));

    const res = await request(app)
      .post(EMAIL_TEST_URL)
      .set('Authorization', authHeader)
      .send({ provider: 'smtp' });

    expect(res.status).toBe(502);
    expect(res.body.error).toMatchObject({
      code: 'EMAIL_DELIVERY_FAILED',
      message: 'Gửi email thử qua smtp thất bại: Invalid login: 535',
    });
  });

  it('kênh chưa cấu hình → 400 VALIDATION_ERROR, không gửi', async () => {
    const { authHeader } = await signInAs('SUPER_ADMIN');
    const deliverSpy = vi.spyOn(mailer, 'deliver');

    const res = await request(app)
      .post(EMAIL_TEST_URL)
      .set('Authorization', authHeader)
      .send({ provider: 'resend' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(deliverSpy).not.toHaveBeenCalled();
  });

  it('ADMIN → 403 FORBIDDEN', async () => {
    const { authHeader } = await signInAs('ADMIN');

    const res = await request(app)
      .post(EMAIL_TEST_URL)
      .set('Authorization', authHeader)
      .send({ provider: 'console' });

    expect(res.status).toBe(403);
  });
});
