import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { API_URL } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute, signInAs } from '../utils';

const CURRENT = {
  id: 's-current',
  device: { browser: 'Chrome', os: 'Windows', deviceType: 'desktop' },
  ip: '10.0.0.1',
  lastUsedAt: '2026-09-28T10:00:00.000Z',
  isCurrent: true,
};
const PHONE = {
  id: 's-phone',
  device: { browser: 'Safari', os: 'iOS', deviceType: 'mobile' },
  ip: '10.0.0.2',
  lastUsedAt: '2026-09-27T10:00:00.000Z',
  isCurrent: false,
};

async function findSessionItems() {
  const list = await screen.findByRole('list', { name: 'Thiết bị đang đăng nhập' });
  return within(list).getAllByRole('listitem');
}

/** Giả lập server giữ danh sách phiên, thu hồi thật sự xoá khỏi danh sách. */
function mockSessionsServer(initialSessions) {
  let sessions = [...initialSessions];
  server.use(
    http.get(`${API_URL}/sessions`, () => HttpResponse.json({ success: true, data: sessions })),
    http.delete(`${API_URL}/sessions/:id`, ({ params }) => {
      sessions = sessions.filter((session) => session.id !== params.id);
      return HttpResponse.json({
        success: true,
        message: 'Đã thu hồi phiên đăng nhập',
        data: null,
      });
    }),
    http.delete(`${API_URL}/sessions`, () => {
      const revokedCount = sessions.filter((session) => !session.isCurrent).length;
      sessions = sessions.filter((session) => session.isCurrent);
      return HttpResponse.json({
        success: true,
        message: `Đã đăng xuất ${revokedCount} thiết bị khác`,
        data: { revokedCount },
      });
    }),
  );
}

describe('[bai-07] Trang phiên đăng nhập', () => {
  it('hiển thị thiết bị, đánh dấu phiên hiện tại (không có nút thu hồi)', async () => {
    mockSessionsServer([CURRENT, PHONE]);
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/sessions');

    const items = await findSessionItems();
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Chrome trên Windows');
    expect(items[0]).toHaveTextContent('Phiên hiện tại');
    expect(within(items[0]).queryByRole('button', { name: 'Thu hồi' })).toBeNull();
    expect(items[1]).toHaveTextContent('Safari trên iOS');
    expect(items[1]).toHaveTextContent('Điện thoại');
  });

  it('thu hồi 1 phiên: hỏi xác nhận → gọi API → báo thành công, danh sách cập nhật', async () => {
    const user = userEvent.setup();
    mockSessionsServer([CURRENT, PHONE]);
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/sessions');

    await user.click(await screen.findByRole('button', { name: 'Thu hồi' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Thu hồi phiên đăng nhập?' });
    await user.click(within(dialog).getByRole('button', { name: 'Thu hồi' }));

    expect(await screen.findByText('Đã thu hồi phiên đăng nhập')).toBeInTheDocument();
    expect(
      await screen.findByText('Bạn chỉ đang đăng nhập trên thiết bị này.'),
    ).toBeInTheDocument();
    expect(await findSessionItems()).toHaveLength(1);
  });

  it('huỷ trong hộp thoại xác nhận → không gọi API', async () => {
    const user = userEvent.setup();
    mockSessionsServer([CURRENT, PHONE]);
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/sessions');

    await user.click(await screen.findByRole('button', { name: 'Thu hồi' }));
    await user.click(screen.getByRole('button', { name: 'Huỷ' }));

    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(await findSessionItems()).toHaveLength(2);
  });

  it('đăng xuất mọi thiết bị khác', async () => {
    const user = userEvent.setup();
    mockSessionsServer([CURRENT, PHONE, { ...PHONE, id: 's-tablet' }]);
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/sessions');

    await user.click(await screen.findByRole('button', { name: 'Đăng xuất mọi thiết bị khác' }));
    await user.click(screen.getByRole('button', { name: 'Đăng xuất tất cả' }));

    expect(await screen.findByText('Đã đăng xuất 2 thiết bị khác')).toBeInTheDocument();
  });

  it('lỗi tải danh sách → thông báo lỗi + nút thử lại', async () => {
    server.use(
      http.get(`${API_URL}/sessions`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: 'Đã có lỗi xảy ra' } },
          { status: 500 },
        ),
      ),
    );
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/sessions');

    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được danh sách phiên');
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });
});
