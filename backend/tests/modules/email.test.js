import { render } from '@react-email/components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { emailService } from '../../src/modules/email/email.service.js';
import { Setting } from '../../src/modules/settings/settings.model.js';
import { SETTING_KEYS } from '../../src/modules/settings/settings.registry.js';
import { mailer } from '../../src/shared/lib/mailer.js';

const USER = { email: 'an@example.com', name: 'Nguyễn An' };

/** Chặn mailer.deliver (không gửi thật) để lấy kênh gửi và nội dung email dạng text. */
async function captureSentEmail(sendEmail) {
  const deliverSpy = vi.spyOn(mailer, 'deliver').mockResolvedValue();
  sendEmail();
  await mailer.waitForPending();
  const { to, subject, element, provider } = deliverSpy.mock.calls[0][0];
  return { to, subject, provider, text: await render(element, { plainText: true }) };
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Setting.deleteMany({});
});

describe('[bai-03] emailService — nội dung email', () => {
  it('email xác thực có tên người nhận và link về trang /verify-email của frontend', async () => {
    const email = await captureSentEmail(() =>
      emailService.sendVerifyEmail({ user: USER, token: 'abc123', expiresInHours: 24 }),
    );

    expect(email).toMatchObject({ to: USER.email, subject: 'Xác thực email của bạn' });
    expect(email.text).toContain('Xin chào Nguyễn An');
    expect(email.text).toContain('http://localhost:5173/verify-email?token=abc123');
    expect(email.text).toContain('24 giờ');
  });

  it('email đặt mật khẩu có link /reset-password kèm token', async () => {
    const email = await captureSentEmail(() =>
      emailService.sendSetPasswordEmail({ user: USER, token: 'xyz', expiresInMinutes: 60 }),
    );

    expect(email.text).toContain('http://localhost:5173/reset-password?token=xyz');
  });
});

describe('[bai-15] emailService — kênh gửi theo cấu hình của Super Admin', () => {
  it('chưa chọn kênh → dùng kênh mặc định EMAIL_DELIVERY (console khi test)', async () => {
    const email = await captureSentEmail(() => emailService.sendWelcomeEmail({ user: USER }));

    expect(email.provider).toBe('console');
  });

  it('đã chọn SMTP ở trang Cấu hình → mọi email đi qua SMTP', async () => {
    await Setting.create({ key: SETTING_KEYS.EMAIL_PROVIDER, value: 'smtp' });

    const email = await captureSentEmail(() => emailService.sendWelcomeEmail({ user: USER }));

    expect(email.provider).toBe('smtp');
  });

  it('kênh đã lưu nhưng server bị gỡ biến môi trường (Resend) → quay về kênh mặc định', async () => {
    await Setting.create({ key: SETTING_KEYS.EMAIL_PROVIDER, value: 'resend' });

    const email = await captureSentEmail(() => emailService.sendWelcomeEmail({ user: USER }));

    expect(email.provider).toBe('console');
  });
});
