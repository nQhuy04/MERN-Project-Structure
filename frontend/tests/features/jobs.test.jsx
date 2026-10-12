import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { API_URL } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute, selectMenuItem, signInAs } from '../utils';

const TYPES = [
  {
    type: 'CLEANUP_ORPHAN_MEDIA',
    label: 'Dọn ảnh mồ côi',
    description: 'Xoá ảnh mồ côi.',
    isSystemOnly: true,
    configFields: [],
  },
  {
    type: 'SEND_EMAIL',
    label: 'Gửi email thông báo',
    description: 'Gửi email.',
    isSystemOnly: false,
    configFields: [
      { name: 'subject', label: 'Tiêu đề', input: 'text' },
      { name: 'content', label: 'Nội dung', input: 'textarea' },
      { name: 'roles', label: 'Gửi tới vai trò', input: 'roles' },
    ],
  },
];

const SYSTEM_JOB = {
  id: 'j-system',
  name: 'Dọn ảnh mồ côi',
  type: 'CLEANUP_ORPHAN_MEDIA',
  config: {},
  schedule: { kind: 'INTERVAL', everyDays: 1, time: '03:00' },
  nextRunAt: '2026-09-30T20:00:00.000Z',
  isPaused: false,
  isSystem: true,
  isRunning: false,
  lastRunAt: null,
  lastRunStatus: null,
};

function mockJobsServer(jobs) {
  const requests = [];
  server.use(
    http.get(`${API_URL}/admin/jobs`, () => HttpResponse.json({ success: true, data: jobs })),
    http.get(`${API_URL}/admin/jobs/types`, () =>
      HttpResponse.json({ success: true, data: TYPES }),
    ),
    http.post(`${API_URL}/admin/jobs`, async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json({ success: true, message: 'Đã tạo job', data: {} }, { status: 201 });
    }),
    http.post(`${API_URL}/admin/jobs/:id/run`, () =>
      HttpResponse.json({
        success: true,
        message: 'Job đã chạy xong',
        data: { status: 'SUCCESS' },
      }),
    ),
  );
  return requests;
}

describe('[bai-14] Trang lịch tự động (Super Admin)', () => {
  it('job hệ thống: có lịch dễ đọc, badge "Hệ thống", không có nút Xoá; chạy ngay → thông báo', async () => {
    const user = userEvent.setup();
    mockJobsServer([SYSTEM_JOB]);
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/jobs');

    const table = await screen.findByRole('table', { name: 'Danh sách job' });
    const row = within(table).getByRole('row', { name: /Dọn ảnh mồ côi/ });
    expect(row).toHaveTextContent('Hệ thống');
    expect(row).toHaveTextContent('Hằng ngày lúc 03:00');
    await user.click(within(row).getByRole('button', { name: 'Thao tác với Dọn ảnh mồ côi' }));
    expect(screen.getByRole('menuitem', { name: 'Tạm dừng' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Xoá' })).toBeNull();
    await user.keyboard('{Escape}');

    await user.click(within(row).getByRole('button', { name: 'Chạy ngay' }));
    expect(await screen.findByText('Job đã chạy xong')).toBeInTheDocument();
  });

  it('tạo job gửi email: form sinh từ loại job, gửi đúng payload (config + lịch)', async () => {
    const user = userEvent.setup();
    const requests = mockJobsServer([]);
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/jobs');

    await user.click(await screen.findByRole('button', { name: 'Tạo job' }));
    const form = screen.getByRole('form', { name: 'Tạo job mới' });
    expect(within(form).getByRole('option', { name: 'Gửi email thông báo' })).toBeInTheDocument();
    expect(within(form).queryByRole('option', { name: 'Dọn ảnh mồ côi' })).toBeNull();

    await user.type(within(form).getByLabelText('Tên job'), 'Bản tin tuần');
    await user.type(within(form).getByLabelText('Tiêu đề'), 'Tin tuần');
    await user.type(within(form).getByLabelText('Nội dung'), 'Xin chào');
    await user.click(within(form).getByLabelText('Thành viên'));
    await user.clear(within(form).getByLabelText('Mỗi (ngày)'));
    await user.type(within(form).getByLabelText('Mỗi (ngày)'), '7');
    await user.click(within(form).getByRole('button', { name: 'Tạo job' }));

    expect(await screen.findByText('Đã tạo job')).toBeInTheDocument();
    expect(requests[0]).toEqual({
      name: 'Bản tin tuần',
      type: 'SEND_EMAIL',
      config: { subject: 'Tin tuần', content: 'Xin chào', roles: ['MEMBER'] },
      schedule: { kind: 'INTERVAL', everyDays: 7, time: '09:00' },
    });
  });

  it('lỗi config từ server gắn vào đúng ô', async () => {
    const user = userEvent.setup();
    mockJobsServer([]);
    server.use(
      http.post(`${API_URL}/admin/jobs`, () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Dữ liệu không hợp lệ',
              details: [
                { field: 'config.roles', message: 'Chọn ít nhất một vai trò hoặc người nhận' },
              ],
            },
          },
          { status: 400 },
        ),
      ),
    );
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/jobs');

    await user.click(await screen.findByRole('button', { name: 'Tạo job' }));
    const form = screen.getByRole('form', { name: 'Tạo job mới' });
    await user.type(within(form).getByLabelText('Tên job'), 'X');
    await user.click(within(form).getByRole('button', { name: 'Tạo job' }));

    expect(
      await within(form).findByText('Chọn ít nhất một vai trò hoặc người nhận'),
    ).toBeInTheDocument();
  });

  it('tạm dừng job: gọi /pause → thông báo, danh sách tải lại và hiện "Tạm dừng"', async () => {
    const user = userEvent.setup();
    let jobs = [SYSTEM_JOB];
    let listCount = 0;
    server.use(
      http.get(`${API_URL}/admin/jobs`, () => {
        listCount += 1;
        return HttpResponse.json({ success: true, data: jobs });
      }),
      http.get(`${API_URL}/admin/jobs/types`, () =>
        HttpResponse.json({ success: true, data: TYPES }),
      ),
      http.post(`${API_URL}/admin/jobs/:id/pause`, ({ params }) => {
        jobs = jobs.map((job) =>
          job.id === params.id ? { ...job, isPaused: true, nextRunAt: null } : job,
        );
        return HttpResponse.json({ success: true, message: 'Đã tạm dừng job', data: jobs[0] });
      }),
    );
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/jobs');

    await selectMenuItem(user, { menu: 'Thao tác với Dọn ảnh mồ côi', item: 'Tạm dừng' });

    expect(await screen.findByText('Đã tạm dừng job')).toBeInTheDocument();
    expect(await screen.findByText('Tạm dừng')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thao tác với Dọn ảnh mồ côi' }));
    expect(screen.getByRole('menuitem', { name: 'Tiếp tục' })).toBeInTheDocument();
    expect(listCount).toBeGreaterThanOrEqual(2);
  });

  it('tiếp tục job đang tạm dừng: gọi /resume, nút trở lại "Tạm dừng"', async () => {
    const user = userEvent.setup();
    let jobs = [{ ...SYSTEM_JOB, isPaused: true, nextRunAt: null }];
    let resumedId;
    server.use(
      http.get(`${API_URL}/admin/jobs`, () => HttpResponse.json({ success: true, data: jobs })),
      http.get(`${API_URL}/admin/jobs/types`, () =>
        HttpResponse.json({ success: true, data: TYPES }),
      ),
      http.post(`${API_URL}/admin/jobs/:id/resume`, ({ params }) => {
        resumedId = params.id;
        jobs = jobs.map((job) => ({ ...job, isPaused: false, nextRunAt: SYSTEM_JOB.nextRunAt }));
        return HttpResponse.json({ success: true, message: 'Đã tiếp tục job', data: jobs[0] });
      }),
    );
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/jobs');

    await selectMenuItem(user, { menu: 'Thao tác với Dọn ảnh mồ côi', item: 'Tiếp tục' });

    expect(await screen.findByText('Đã tiếp tục job')).toBeInTheDocument();
    expect(resumedId).toBe('j-system');
    await waitFor(() => expect(screen.queryByText('Tạm dừng')).toBeNull());
    await user.click(screen.getByRole('button', { name: 'Thao tác với Dọn ảnh mồ côi' }));
    expect(screen.getByRole('menuitem', { name: 'Tạm dừng' })).toBeInTheDocument();
  });

  it('ADMIN không thấy mục Lịch tự động và không vào được trang', async () => {
    signInAs(TEST_USERS.ADMIN);
    const { unmount } = renderRoute('/admin');

    const sidebar = await screen.findByRole('navigation', { name: 'Menu quản trị' });
    expect(within(sidebar).queryByRole('link', { name: 'Lịch tự động' })).toBeNull();
    unmount();

    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/jobs');
    expect(
      await screen.findByRole('heading', { name: 'Bạn không có quyền truy cập trang này' }),
    ).toBeInTheDocument();
  });
});

describe('[bai-14] Trang tổng quan quản trị', () => {
  it('hiện số liệu người dùng, ảnh, lịch tự động và lần chạy lỗi', async () => {
    server.use(
      http.get(`${API_URL}/admin/stats`, () =>
        HttpResponse.json({
          success: true,
          data: {
            users: {
              total: 10,
              byRole: { MEMBER: 8, ADMIN: 1, SUPER_ADMIN: 1 },
              byStatus: { ACTIVE: 7, LOCKED: 1, UNVERIFIED: 2 },
            },
            media: { total: 4, orphans: 1 },
            jobs: {
              total: 3,
              active: 2,
              recentFailures: [
                { jobName: 'Bản tin', startedAt: '2026-09-29T00:00:00Z', error: 'SMTP sập' },
              ],
            },
          },
        }),
      ),
    );
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin');

    expect(
      await screen.findByText('Hoạt động 7 · Bị khoá 1 · Chưa kích hoạt 2'),
    ).toBeInTheDocument();
    expect(screen.getByText('Mồ côi 1')).toBeInTheDocument();
    expect(screen.getByText(/Bản tin: SMTP sập/)).toBeInTheDocument();
  });
});
