import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { features } from '../../src/shared/config/features.js';
import { logger } from '../../src/shared/lib/logger.js';
import { mailer } from '../../src/shared/lib/mailer.js';

// Không gọi dịch vụ thật: thay Nodemailer và Resend bằng hàm giả.
const { sendMail, createTransport, resendSend } = vi.hoisted(() => {
  const sendMailMock = vi.fn();
  return {
    sendMail: sendMailMock,
    createTransport: vi.fn(() => ({ sendMail: sendMailMock })),
    resendSend: vi.fn(),
  };
});
vi.mock('nodemailer', () => ({ default: { createTransport } }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: resendSend };
  },
}));

const Hello = ({ name }) => createElement('p', null, `Xin chào ${name}`);
const MESSAGE = {
  to: 'an@example.com',
  subject: 'Chào',
  element: createElement(Hello, { name: 'An' }),
};

beforeEach(() => {
  sendMail.mockReset().mockResolvedValue({ messageId: 'smtp-1' });
  resendSend.mockReset().mockResolvedValue({ data: { id: 'resend-1' }, error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('[bai-15] mailer.deliver — kênh SMTP (Nodemailer)', () => {
  it('smtp → Nodemailer gửi HTML + text từ EMAIL_FROM; transport tạo một lần rồi dùng lại', async () => {
    await mailer.deliver({ ...MESSAGE, provider: 'smtp' });
    await mailer.deliver({ ...MESSAGE, provider: 'smtp' });

    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.test.local',
        port: 587,
        secure: false,
        auth: { user: 'mailer@test.local', pass: 'test-smtp-pass' },
        connectionTimeout: expect.any(Number),
      }),
    );
    expect(sendMail).toHaveBeenCalledWith({
      from: 'MERN Base <mailer@test.local>',
      to: 'an@example.com',
      subject: 'Chào',
      html: expect.stringContaining('Xin chào An'),
      text: expect.stringContaining('Xin chào An'),
    });
  });

  it('smtp: máy chủ từ chối (sai mật khẩu ứng dụng...) → lỗi ném ra cho người gọi', async () => {
    sendMail.mockRejectedValue(new Error('Invalid login: 535 Username and Password not accepted'));

    await expect(mailer.deliver({ ...MESSAGE, provider: 'smtp' })).rejects.toThrow(/Invalid login/);
  });
});

describe('[bai-03] mailer.deliver — kênh console, Resend và kênh chưa cấu hình', () => {
  it('console → chỉ in text ra log, không gọi nhà cung cấp nào', async () => {
    const infoSpy = vi.spyOn(logger, 'info');

    await mailer.deliver({ ...MESSAGE, provider: 'console' });

    expect(infoSpy).toHaveBeenCalledWith(
      { to: 'an@example.com', subject: 'Chào' },
      expect.stringContaining('Xin chào An'),
    );
    expect(sendMail).not.toHaveBeenCalled();
    expect(resendSend).not.toHaveBeenCalled();
  });

  it('không truyền provider → dùng kênh mặc định EMAIL_DELIVERY (console khi test)', async () => {
    const infoSpy = vi.spyOn(logger, 'info');

    await mailer.deliver(MESSAGE);

    expect(infoSpy).toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('kênh chưa cấu hình biến môi trường (Resend trong test) → lỗi rõ ràng, không gọi gì', async () => {
    await expect(mailer.deliver({ ...MESSAGE, provider: 'resend' })).rejects.toThrow(
      'Kênh gửi email "resend" chưa được cấu hình biến môi trường',
    );
    expect(resendSend).not.toHaveBeenCalled();
  });

  it('resend (đã cấu hình) → gọi API; Resend trả error → ném lỗi', async () => {
    vi.spyOn(features, 'isEmailProviderAvailable').mockReturnValue(true);

    await mailer.deliver({ ...MESSAGE, provider: 'resend' });
    expect(resendSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'an@example.com', subject: 'Chào' }),
    );

    resendSend.mockResolvedValue({ data: null, error: { message: 'domain chưa xác minh' } });
    await expect(mailer.deliver({ ...MESSAGE, provider: 'resend' })).rejects.toThrow(
      'Resend từ chối email: domain chưa xác minh',
    );
  });
});

describe('[bai-03] mailer.runInBackground — gửi nền', () => {
  it('không chặn người gọi; waitForPending chờ gửi xong; lỗi chỉ ghi log', async () => {
    const errorSpy = vi.spyOn(logger, 'error');
    const BrokenTemplate = () => {
      throw new Error('template lỗi');
    };
    const message = {
      to: 'an@example.com',
      subject: 'Lỗi',
      element: createElement(BrokenTemplate),
    };

    expect(() => mailer.runInBackground(() => mailer.deliver(message), message)).not.toThrow();
    await mailer.waitForPending();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'an@example.com', subject: 'Lỗi' }),
      'Gửi email thất bại',
    );
  });
});
