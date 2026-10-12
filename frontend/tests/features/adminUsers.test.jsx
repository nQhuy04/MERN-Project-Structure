import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { getAllowedActions } from '@/features/users/permissions';
import { API_URL } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute, selectMenuItem, signInAs } from '../utils';

const MEMBER_ROW = {
  id: 'u-1',
  name: 'Trần Bình',
  email: 'binh@example.com',
  role: 'MEMBER',
  status: 'ACTIVE',
  lastLoginAt: null,
};
const ADMIN_ROW = { ...MEMBER_ROW, id: 'u-2', name: 'Lê Chi', role: 'ADMIN' };

/** Giả lập API danh sách; ghi lại query của mỗi lần gọi. */
function mockUserList(items, meta = { page: 1, limit: 20, total: items.length, totalPages: 1 }) {
  const requests = [];
  server.use(
    http.get(`${API_URL}/admin/users`, ({ request }) => {
      requests.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json({ success: true, data: items, meta });
    }),
  );
  return requests;
}

async function findRow(name) {
  const table = await screen.findByRole('table', { name: 'Danh sách người dùng' });
  return within(table).getByRole('row', { name: new RegExp(name) });
}

describe('[bai-11] Trang quản lý người dùng', () => {
  it('ADMIN: thấy danh sách; Khoá được MEMBER, không có menu thao tác với ADMIN khác, không đổi vai trò', async () => {
    const user = userEvent.setup();
    mockUserList([MEMBER_ROW, ADMIN_ROW]);
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/users');

    const memberRow = await findRow('Trần Bình');
    await user.click(within(memberRow).getByRole('button', { name: 'Thao tác với Trần Bình' }));
    expect(screen.getByRole('menuitem', { name: 'Khoá' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Nâng quyền' })).toBeNull();
    const adminRow = await findRow('Lê Chi');
    expect(within(adminRow).queryByRole('button')).toBeNull();
  });

  it('bộ lọc lưu trên URL, đổi bộ lọc quay về trang 1', async () => {
    const user = userEvent.setup();
    const requests = mockUserList([MEMBER_ROW], { page: 2, limit: 20, total: 30, totalPages: 2 });
    signInAs(TEST_USERS.ADMIN);
    const { router } = renderRoute('/admin/users?page=2');

    await findRow('Trần Bình');
    await user.selectOptions(screen.getByLabelText('Trạng thái'), 'LOCKED');
    // Ô tìm kiếm tự áp dụng khi ngừng gõ; Enter áp dụng ngay.
    await user.type(screen.getByLabelText('Tên hoặc email'), 'binh{Enter}');

    expect(router.state.location.search).toBe('?status=LOCKED&q=binh');
    expect(requests.at(-1)).toMatchObject({ status: 'LOCKED', q: 'binh', page: '1' });
  });

  it('phân trang: bấm "Trang sau" → page=2 trên URL', async () => {
    const user = userEvent.setup();
    mockUserList([MEMBER_ROW], { page: 1, limit: 20, total: 30, totalPages: 2 });
    signInAs(TEST_USERS.ADMIN);
    const { router } = renderRoute('/admin/users');

    await user.click(await screen.findByRole('button', { name: 'Trang sau' }));

    expect(router.state.location.search).toBe('?page=2');
  });

  it('khoá: hỏi xác nhận → gọi API → thông báo → tải lại danh sách', async () => {
    const user = userEvent.setup();
    const requests = mockUserList([MEMBER_ROW]);
    let lockedId;
    server.use(
      http.patch(`${API_URL}/admin/users/:id/lock`, ({ params }) => {
        lockedId = params.id;
        return HttpResponse.json({
          success: true,
          message: 'Đã khoá tài khoản và đăng xuất mọi thiết bị của người dùng',
          data: { ...MEMBER_ROW, status: 'LOCKED' },
        });
      }),
    );
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/users');

    await selectMenuItem(user, {
      scope: within(await findRow('Trần Bình')),
      menu: 'Thao tác với Trần Bình',
      item: 'Khoá',
    });
    const dialog = screen.getByRole('alertdialog', { name: 'Khoá tài khoản Trần Bình?' });
    await user.click(within(dialog).getByRole('button', { name: 'Khoá' }));

    expect(await screen.findByText(/Đã khoá tài khoản/)).toBeInTheDocument();
    expect(lockedId).toBe('u-1');
    expect(requests.length).toBeGreaterThanOrEqual(2);
  });

  it('Super Admin nâng quyền: hỏi xác nhận → gọi API đúng vai trò → thông báo, tải lại danh sách', async () => {
    const user = userEvent.setup();
    const requests = mockUserList([MEMBER_ROW]);
    let roleRequest;
    server.use(
      http.patch(`${API_URL}/admin/users/:id/role`, async ({ params, request }) => {
        roleRequest = { id: params.id, body: await request.json() };
        return HttpResponse.json({
          success: true,
          message: 'Đã cập nhật vai trò người dùng',
          data: { ...MEMBER_ROW, role: 'ADMIN' },
        });
      }),
    );
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/users');

    await selectMenuItem(user, {
      scope: within(await findRow('Trần Bình')),
      menu: 'Thao tác với Trần Bình',
      item: 'Nâng quyền',
    });
    const dialog = screen.getByRole('alertdialog', {
      name: 'Nâng Trần Bình lên Quản trị viên?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Nâng quyền' }));

    expect(await screen.findByText(/Đã cập nhật vai trò/)).toBeInTheDocument();
    expect(roleRequest).toEqual({ id: 'u-1', body: { role: 'ADMIN' } });
    expect(requests.length).toBeGreaterThanOrEqual(2);
  });

  it('Super Admin hạ quyền ADMIN → gửi role MEMBER', async () => {
    const user = userEvent.setup();
    mockUserList([ADMIN_ROW]);
    let sentRole;
    server.use(
      http.patch(`${API_URL}/admin/users/:id/role`, async ({ request }) => {
        sentRole = (await request.json()).role;
        return HttpResponse.json({
          success: true,
          message: 'Đã cập nhật vai trò người dùng',
          data: { ...ADMIN_ROW, role: 'MEMBER' },
        });
      }),
    );
    signInAs(TEST_USERS.SUPER_ADMIN);
    renderRoute('/admin/users');

    await selectMenuItem(user, {
      scope: within(await findRow('Lê Chi')),
      menu: 'Thao tác với Lê Chi',
      item: 'Hạ quyền',
    });
    const dialog = screen.getByRole('alertdialog', { name: 'Hạ Lê Chi về Thành viên?' });
    await user.click(within(dialog).getByRole('button', { name: 'Hạ quyền' }));

    await screen.findByText(/Đã cập nhật vai trò/);
    expect(sentRole).toBe('MEMBER');
  });

  it('không có kết quả → trạng thái rỗng', async () => {
    mockUserList([]);
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/users');

    expect(await screen.findByText('Không có người dùng nào khớp bộ lọc.')).toBeInTheDocument();
  });

  it('MEMBER không vào được trang', async () => {
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/admin/users');

    expect(
      await screen.findByRole('heading', { name: 'Bạn không có quyền truy cập trang này' }),
    ).toBeInTheDocument();
  });
});

describe('[bai-11] getAllowedActions — ẩn/hiện nút theo quyền (khớp backend)', () => {
  it.each([
    ['ADMIN', 'MEMBER', { canLock: true, canChangeRole: false }],
    ['ADMIN', 'ADMIN', { canLock: false, canChangeRole: false }],
    ['SUPER_ADMIN', 'ADMIN', { canLock: true, canChangeRole: true }],
    ['SUPER_ADMIN', 'SUPER_ADMIN', { canLock: false, canChangeRole: false }],
  ])('%s thao tác trên %s', (actorRole, targetRole, expected) => {
    expect(getAllowedActions({ id: 'a', role: actorRole }, { id: 'b', role: targetRole })).toEqual(
      expected,
    );
  });

  it('không thao tác trên chính mình', () => {
    expect(getAllowedActions({ id: 'a', role: 'SUPER_ADMIN' }, { id: 'a', role: 'ADMIN' })).toEqual(
      {
        canLock: false,
        canChangeRole: false,
      },
    );
  });
});
