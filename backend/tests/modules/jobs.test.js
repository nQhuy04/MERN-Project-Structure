import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app.js';
import { EmailToken } from '../../src/modules/auth/emailTokens.model.js';
import { emailService } from '../../src/modules/email/email.service.js';
import { Job, JobRun } from '../../src/modules/jobs/jobs.model.js';
import { JOB_DEFINITIONS } from '../../src/modules/jobs/jobs.registry.js';
import { STALE_LOCK_MS, jobsRunner } from '../../src/modules/jobs/jobs.runner.js';
import { jobsService } from '../../src/modules/jobs/jobs.service.js';
import { Session } from '../../src/modules/sessions/sessions.model.js';
import { User } from '../../src/modules/users/users.model.js';
import { mailer } from '../../src/shared/lib/mailer.js';
import { signIn } from '../helpers/auth.js';
import { createUser } from '../helpers/factories.js';

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const TRIGGER_SECRET = 'test-jobs-secret-chi-dung-cho-test-0123456789';

/** Job SEND_EMAIL đến hạn chạy (handler được thay bằng spy khi cần). */
function createDueJob(overrides = {}) {
  return Job.create({
    name: 'Thông báo',
    type: 'SEND_EMAIL',
    config: { subject: 'Chào', content: 'Nội dung', roles: ['MEMBER'], userIds: [] },
    schedule: { kind: 'INTERVAL', everyDays: 1, time: '03:00' },
    nextRunAt: new Date(Date.now() - MINUTE_MS),
    ...overrides,
  });
}

async function superAdminHeader() {
  return (await signIn(await createUser({ role: 'SUPER_ADMIN' }))).authHeader;
}

afterEach(async () => {
  vi.restoreAllMocks();
  await mailer.waitForPending();
  await Promise.all([
    Job.deleteMany({}),
    JobRun.deleteMany({}),
    User.deleteMany({}),
    Session.deleteMany({}),
    EmailToken.deleteMany({}),
  ]);
});

describe('[bai-14] jobsRunner — chạy job đến hạn', () => {
  it('chạy job đến hạn, lưu lịch sử, nhả khoá, dời lịch tới mốc kế tiếp (neo theo mốc cũ)', async () => {
    const job = await createDueJob();
    const scheduledAt = job.nextRunAt;

    const executedCount = await jobsRunner.runDueJobs();

    expect(executedCount).toBe(1);
    const updated = await Job.findById(job._id);
    expect(updated).toMatchObject({ lockedAt: null, lastRunStatus: 'SUCCESS' });
    expect(updated.nextRunAt.getTime()).toBeGreaterThan(Date.now());
    expect(updated.nextRunAt.getTime() - scheduledAt.getTime()).toBeLessThanOrEqual(2 * DAY_MS);
    const run = await JobRun.findOne({ jobId: job._id });
    expect(run).toMatchObject({
      status: 'SUCCESS',
      result: { recipientCount: 0 },
      isManual: false,
    });
  });

  it('job chưa đến hạn, đang tạm dừng, hoặc ONCE đã chạy (nextRunAt null) → không chạy', async () => {
    await createDueJob({ nextRunAt: new Date(Date.now() + DAY_MS) });
    await createDueJob({ isPaused: true });
    await createDueJob({ nextRunAt: null });

    expect(await jobsRunner.runDueJobs()).toBe(0);
  });

  it('ONCE: chạy xong thì nextRunAt = null', async () => {
    const job = await createDueJob({
      schedule: { kind: 'ONCE', runAt: new Date(Date.now() - MINUTE_MS) },
    });

    await jobsRunner.runDueJobs();

    expect((await Job.findById(job._id)).nextRunAt).toBeNull();
  });

  it('2 lần kích hoạt cùng lúc → mỗi job chỉ chạy 1 lần (khoá nguyên tử)', async () => {
    await createDueJob();
    const handler = vi.spyOn(JOB_DEFINITIONS.SEND_EMAIL, 'handler');

    const [first, second] = await Promise.all([jobsRunner.runDueJobs(), jobsRunner.runDueJobs()]);

    expect(first + second).toBe(1);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('đang có tiến trình giữ khoá → bỏ qua; khoá quá 15 phút (tiến trình chết) → lấy lại', async () => {
    const fresh = await createDueJob({ lockedAt: new Date() });
    const stale = await createDueJob({
      lockedAt: new Date(Date.now() - STALE_LOCK_MS - MINUTE_MS),
    });

    expect(await jobsRunner.runDueJobs()).toBe(1);
    expect(await JobRun.exists({ jobId: stale._id })).toBeTruthy();
    expect(await JobRun.exists({ jobId: fresh._id })).toBeNull();
  });

  it('server ngủ nhiều ngày → chỉ chạy bù 1 lần rồi hẹn mốc tương lai', async () => {
    const job = await createDueJob({ nextRunAt: new Date(Date.now() - 5 * DAY_MS) });

    expect(await jobsRunner.runDueJobs()).toBe(1);
    expect(await jobsRunner.runDueJobs()).toBe(0);
    expect((await Job.findById(job._id)).nextRunAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('handler lỗi → lịch sử FAILED kèm thông điệp, job vẫn nhả khoá và dời lịch', async () => {
    const job = await createDueJob();
    vi.spyOn(JOB_DEFINITIONS.SEND_EMAIL, 'handler').mockRejectedValueOnce(new Error('SMTP sập'));

    await jobsRunner.runDueJobs();

    expect(await JobRun.findOne({ jobId: job._id })).toMatchObject({
      status: 'FAILED',
      error: 'SMTP sập',
    });
    const updated = await Job.findById(job._id);
    expect(updated).toMatchObject({ lockedAt: null, lastRunStatus: 'FAILED' });
    expect(updated.nextRunAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('[bai-14] Loại job — handler', () => {
  it('SEND_EMAIL: gửi tới người dùng đang hoạt động theo role + danh sách id', async () => {
    await createUser({ email: 'member@example.com' });
    await createUser({ email: 'locked@example.com', lockedAt: new Date() });
    await createUser({ email: 'unverified@example.com', emailVerifiedAt: null });
    const admin = await createUser({ email: 'admin@example.com', role: 'ADMIN' });
    const spy = vi.spyOn(emailService, 'sendAnnouncementEmail');

    const result = await JOB_DEFINITIONS.SEND_EMAIL.handler({
      subject: 'Bảo trì',
      content: 'Tối nay bảo trì.',
      roles: ['MEMBER'],
      userIds: [String(admin._id)],
    });

    expect(result).toEqual({
      recipientCount: 2,
      sentCount: 2,
      failedCount: 0,
      skippedCount: 0,
    });
    expect(spy.mock.calls.map(([params]) => params.user.email).sort()).toEqual([
      'admin@example.com',
      'member@example.com',
    ]);
  });

  it('SEND_EMAIL: một phần email lỗi → đếm đúng sentCount / failedCount, job vẫn SUCCESS', async () => {
    await createUser({ email: 'ok@example.com' });
    await createUser({ email: 'loi@example.com' });
    vi.spyOn(emailService, 'sendAnnouncementEmail').mockImplementation(({ user }) =>
      user.email === 'loi@example.com'
        ? Promise.reject(new Error('Resend từ chối email'))
        : Promise.resolve(),
    );

    const result = await JOB_DEFINITIONS.SEND_EMAIL.handler({
      subject: 'Bảo trì',
      content: 'Tối nay bảo trì.',
      roles: ['MEMBER'],
      userIds: [],
    });

    expect(result).toMatchObject({ recipientCount: 2, sentCount: 1, failedCount: 1 });
  });

  it('SEND_EMAIL: gửi tuần tự, không gọi song song', async () => {
    await createUser({ email: 'a@example.com' });
    await createUser({ email: 'b@example.com' });
    await createUser({ email: 'c@example.com' });
    let inFlight = 0;
    let maxInFlight = 0;
    vi.spyOn(emailService, 'sendAnnouncementEmail').mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
    });

    await JOB_DEFINITIONS.SEND_EMAIL.handler({
      subject: 'Bảo trì',
      content: 'Tối nay bảo trì.',
      roles: ['MEMBER'],
      userIds: [],
    });

    expect(maxInFlight).toBe(1);
  });

  it('SEND_EMAIL: mọi email đều lỗi → ném lỗi để lịch sử chạy ghi FAILED', async () => {
    await createUser({ email: 'a@example.com' });
    await createUser({ email: 'b@example.com' });
    vi.spyOn(emailService, 'sendAnnouncementEmail').mockRejectedValue(new Error('Resend sập'));

    await expect(
      JOB_DEFINITIONS.SEND_EMAIL.handler({
        subject: 'Bảo trì',
        content: 'Tối nay bảo trì.',
        roles: ['MEMBER'],
        userIds: [],
      }),
    ).rejects.toThrow('Không gửi được email nào (2 lỗi)');
  });

  it('SEND_EMAIL: không có người nhận nào → SUCCESS với sentCount 0', async () => {
    const result = await JOB_DEFINITIONS.SEND_EMAIL.handler({
      subject: 'Bảo trì',
      content: 'Tối nay bảo trì.',
      roles: ['MEMBER'],
      userIds: [],
    });

    expect(result).toEqual({
      recipientCount: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
    });
  });

  it('CLEANUP_UNVERIFIED_USERS: chỉ xoá tài khoản chưa kích hoạt quá hạn, kèm token của họ', async () => {
    const now = new Date();
    const old = await createUser({ emailVerifiedAt: null, createdAt: new Date(now - 10 * DAY_MS) });
    const recent = await createUser({ emailVerifiedAt: null });
    const verified = await createUser({ createdAt: new Date(now - 10 * DAY_MS) });
    await EmailToken.create({
      userId: old._id,
      type: 'VERIFY_EMAIL',
      tokenHash: 'h1',
      expiresAt: new Date(now.getTime() + DAY_MS),
    });

    const result = await JOB_DEFINITIONS.CLEANUP_UNVERIFIED_USERS.handler(
      { olderThanDays: 7 },
      { now },
    );

    expect(result).toEqual({ deletedCount: 1 });
    expect(await User.exists({ _id: old._id })).toBeNull();
    expect(await User.exists({ _id: recent._id })).toBeTruthy();
    expect(await User.exists({ _id: verified._id })).toBeTruthy();
    expect(await EmailToken.countDocuments({ userId: old._id })).toBe(0);
  });
});

describe('[bai-14] /admin/jobs — quản lý lịch tự động (Super Admin)', () => {
  it('ADMIN → 403', async () => {
    const { authHeader } = await signIn(await createUser({ role: 'ADMIN' }));

    expect(
      (await request(app).get('/api/v1/admin/jobs').set('Authorization', authHeader)).status,
    ).toBe(403);
  });

  it('tạo job gửi email: tính nextRunAt; config sai → lỗi ở đúng ô config.*', async () => {
    const authHeader = await superAdminHeader();
    const schedule = { kind: 'INTERVAL', everyDays: 7, time: '09:00' };

    const created = await request(app)
      .post('/api/v1/admin/jobs')
      .set('Authorization', authHeader)
      .send({
        name: 'Bản tin tuần',
        type: 'SEND_EMAIL',
        config: { subject: 'Tin tuần', content: 'Nội dung', roles: ['MEMBER'] },
        schedule,
      });
    expect(created.status).toBe(201);
    expect(Date.parse(created.body.data.nextRunAt)).toBeGreaterThan(Date.now());

    const invalid = await request(app)
      .post('/api/v1/admin/jobs')
      .set('Authorization', authHeader)
      .send({ name: 'Sai', type: 'SEND_EMAIL', config: { subject: '', content: 'x' }, schedule });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details.map((detail) => detail.field)).toContain('config.subject');
  });

  it('không tạo được loại job chỉ dành cho hệ thống; lịch ONCE ở quá khứ → 400', async () => {
    const authHeader = await superAdminHeader();

    const systemType = await request(app)
      .post('/api/v1/admin/jobs')
      .set('Authorization', authHeader)
      .send({
        name: 'X',
        type: 'CLEANUP_UNVERIFIED_USERS',
        schedule: { kind: 'INTERVAL', everyDays: 1, time: '01:00' },
      });
    expect(systemType.status).toBe(400);

    const past = await request(app)
      .post('/api/v1/admin/jobs')
      .set('Authorization', authHeader)
      .send({
        name: 'Y',
        type: 'SEND_EMAIL',
        config: { subject: 'a', content: 'b', roles: ['MEMBER'] },
        schedule: { kind: 'ONCE', runAt: '2020-01-01T00:00:00Z' },
      });
    expect(past.body.error.details).toEqual([
      { field: 'schedule.runAt', message: 'Thời điểm chạy phải ở tương lai' },
    ]);
  });

  it('job hệ thống: seed idempotent, không xoá được (403), tạm dừng / tiếp tục được', async () => {
    const authHeader = await superAdminHeader();
    expect(await jobsService.ensureSystemJobs()).toBe(3);
    expect(await jobsService.ensureSystemJobs()).toBe(0);
    const systemJob = await Job.findOne({ systemKey: 'cleanup-orphan-media' });

    const removal = await request(app)
      .delete(`/api/v1/admin/jobs/${systemJob._id}`)
      .set('Authorization', authHeader);
    expect(removal.body.error.code).toBe('SYSTEM_JOB_PROTECTED');

    const paused = await request(app)
      .post(`/api/v1/admin/jobs/${systemJob._id}/pause`)
      .set('Authorization', authHeader);
    expect(paused.body.data.isPaused).toBe(true);
    const list = await request(app).get('/api/v1/admin/jobs').set('Authorization', authHeader);
    expect(list.body.data.find((job) => job.id === String(systemJob._id))).toMatchObject({
      isSystem: true,
      isPaused: true,
    });
  });

  it('chạy ngay: có lịch sử chạy (isManual), không đổi lịch; xoá job → xoá cả lịch sử', async () => {
    const authHeader = await superAdminHeader();
    const job = await createDueJob({ nextRunAt: new Date(Date.now() + DAY_MS) });

    const run = await request(app)
      .post(`/api/v1/admin/jobs/${job._id}/run`)
      .set('Authorization', authHeader);
    expect(run.body.data).toMatchObject({ status: 'SUCCESS', isManual: true });
    expect((await Job.findById(job._id)).nextRunAt).toEqual(job.nextRunAt);

    const runs = await request(app)
      .get(`/api/v1/admin/jobs/${job._id}/runs`)
      .set('Authorization', authHeader);
    expect(runs.body.meta.total).toBe(1);

    await request(app)
      .delete(`/api/v1/admin/jobs/${job._id}`)
      .set('Authorization', authHeader)
      .expect(200);
    expect(await JobRun.countDocuments({ jobId: job._id })).toBe(0);
  });

  it('chạy ngay khi job đang chạy → 409 JOB_RUNNING', async () => {
    const authHeader = await superAdminHeader();
    const job = await createDueJob({ lockedAt: new Date() });

    const res = await request(app)
      .post(`/api/v1/admin/jobs/${job._id}/run`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('JOB_RUNNING');
  });

  it('xoá job đang chạy → 409 JOB_RUNNING, giữ nguyên job + lịch sử', async () => {
    const authHeader = await superAdminHeader();
    const job = await createDueJob({ lockedAt: new Date() });
    await JobRun.create({ jobId: job._id, startedAt: new Date() });

    const res = await request(app)
      .delete(`/api/v1/admin/jobs/${job._id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('JOB_RUNNING');
    expect(await Job.exists({ _id: job._id })).toBeTruthy();
    expect(await JobRun.countDocuments({ jobId: job._id })).toBe(1);
  });
});

describe('[bai-14] POST /jobs/trigger — kích hoạt từ cron bên ngoài', () => {
  it('đúng secret → chạy job đến hạn; sai / thiếu secret → 403', async () => {
    await createDueJob();

    const wrong = await request(app).post('/api/v1/jobs/trigger').set('X-Jobs-Secret', 'sai');
    const missing = await request(app).post('/api/v1/jobs/trigger');
    const ok = await request(app).post('/api/v1/jobs/trigger').set('X-Jobs-Secret', TRIGGER_SECRET);

    expect(wrong.status).toBe(403);
    expect(missing.status).toBe(403);
    expect(ok.body.data).toEqual({ executedCount: 1 });
  });
});

describe('[bai-14] GET /admin/stats — số liệu tổng quan', () => {
  it('đếm user theo role / trạng thái, media, job và lần chạy lỗi gần nhất', async () => {
    const { authHeader } = await signIn(await createUser({ role: 'ADMIN' }));
    await createUser({ lockedAt: new Date() });
    await createUser({ emailVerifiedAt: null });
    const job = await createDueJob({ name: 'Job lỗi' });
    vi.spyOn(JOB_DEFINITIONS.SEND_EMAIL, 'handler').mockRejectedValueOnce(new Error('Hỏng'));
    await jobsRunner.runDueJobs();
    await Job.updateOne({ _id: job._id }, { $set: { isPaused: true } });

    const res = await request(app).get('/api/v1/admin/stats').set('Authorization', authHeader);

    expect(res.body.data.users).toEqual({
      total: 3,
      byRole: { MEMBER: 2, ADMIN: 1, SUPER_ADMIN: 0 },
      byStatus: { ACTIVE: 1, LOCKED: 1, UNVERIFIED: 1 },
    });
    expect(res.body.data.media).toEqual({ total: 0, orphans: 0 });
    expect(res.body.data.jobs).toMatchObject({
      total: 1,
      active: 0,
      recentFailures: [{ jobName: 'Job lỗi', error: 'Hỏng' }],
    });
  });
});
