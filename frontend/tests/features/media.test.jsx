import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { API_URL, PUBLIC_SETTINGS } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute, selectMenuItem, signInAs } from '../utils';

const USED = {
  id: 'm-used',
  name: 'mat-an.png',
  folder: 'avatars',
  size: 2048,
  contentType: 'image/png',
  usages: [{ label: 'Ảnh đại diện của An', href: '/admin/users?q=an%40example.com' }],
};
const ORPHAN = { ...USED, id: 'm-orphan', name: 'banner.png', folder: 'banners', usages: [] };

beforeEach(() => {
  server.use(
    http.get(`${API_URL}/settings/public`, () =>
      HttpResponse.json({
        success: true,
        data: { ...PUBLIC_SETTINGS, features: { ...PUBLIC_SETTINGS.features, storage: true } },
      }),
    ),
  );
});

const FOLDERS = [
  {
    name: 'avatars',
    isSystem: true,
    mediaCount: 1,
    totalSize: 2048,
    coverIds: ['m-used'],
    lastUploadedAt: '2026-09-29T00:00:00Z',
    createdAt: null,
  },
  {
    name: 'banners',
    isSystem: false,
    mediaCount: 1,
    totalSize: 2048,
    coverIds: ['m-orphan'],
    lastUploadedAt: '2026-09-29T00:00:00Z',
    createdAt: '2026-09-28T00:00:00Z',
  },
  {
    name: 'trong',
    isSystem: false,
    mediaCount: 0,
    totalSize: 0,
    coverIds: [],
    lastUploadedAt: null,
    createdAt: '2026-09-28T00:00:00Z',
  },
];

/** Giả lập API thư viện; ghi lại query của mỗi lần lấy danh sách ảnh. */
function mockLibrary(items, folders = FOLDERS) {
  const requests = [];
  server.use(
    http.get(`${API_URL}/admin/media`, ({ request }) => {
      requests.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json({
        success: true,
        data: items,
        meta: { page: 1, limit: 20, total: items.length, totalPages: 1 },
      });
    }),
    http.get(`${API_URL}/admin/media/folders`, () =>
      HttpResponse.json({ success: true, data: folders }),
    ),
  );
  return requests;
}

describe('[bai-13] Ảnh đại diện (trang Hồ sơ)', () => {
  it('chọn ảnh → presign avatar → PUT R2 → xác nhận → đặt avatar → header cập nhật', async () => {
    const user = userEvent.setup();
    const steps = [];
    server.use(
      http.post(`${API_URL}/media/avatar/presign`, async ({ request }) => {
        steps.push(['presign', await request.json()]);
        return HttpResponse.json({
          success: true,
          data: {
            media: { id: 'm-new' },
            upload: { url: 'https://r2.example/a', method: 'PUT', headers: {} },
          },
        });
      }),
      http.put('https://r2.example/a', () => {
        steps.push(['r2-put']);
        return new HttpResponse(null, { status: 200 });
      }),
      http.post(`${API_URL}/media/:id/complete`, ({ params }) => {
        steps.push(['complete', params.id]);
        return HttpResponse.json({ success: true, data: { id: params.id } });
      }),
      http.patch(`${API_URL}/users/me/avatar`, async ({ request }) => {
        const body = await request.json();
        steps.push(['set-avatar', body]);
        return HttpResponse.json({
          success: true,
          message: 'Đã cập nhật ảnh đại diện',
          data: { ...TEST_USERS.MEMBER, avatarMediaId: body.mediaId },
        });
      }),
    );
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/profile');

    await user.upload(
      await screen.findByLabelText('Đổi ảnh đại diện'),
      new File(['img'], 'mat.png', { type: 'image/png' }),
    );

    expect(await screen.findByText('Đã cập nhật ảnh đại diện')).toBeInTheDocument();
    expect(steps.map(([step]) => step)).toEqual(['presign', 'r2-put', 'complete', 'set-avatar']);
    expect(steps[3][1]).toEqual({ mediaId: 'm-new' });
    expect(useAuthStore.getState().user.avatarMediaId).toBe('m-new');
    expect(screen.getByRole('img', { name: 'Ảnh đại diện của Thành Viên' })).toHaveAttribute(
      'src',
      `${API_URL}/media/m-new/content`,
    );
  });

  it('gỡ ảnh đại diện: gửi mediaId null, header trở về chữ cái đầu', async () => {
    const user = userEvent.setup();
    let sentBody;
    server.use(
      http.patch(`${API_URL}/users/me/avatar`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({
          success: true,
          message: 'Đã gỡ ảnh đại diện',
          data: { ...TEST_USERS.MEMBER, avatarMediaId: null },
        });
      }),
    );
    signInAs({ ...TEST_USERS.MEMBER, avatarMediaId: 'm-cu' });
    renderRoute('/account/profile');

    await user.click(await screen.findByRole('button', { name: 'Gỡ ảnh' }));

    expect(await screen.findByText('Đã gỡ ảnh đại diện')).toBeInTheDocument();
    expect(sentBody).toEqual({ mediaId: null });
    expect(useAuthStore.getState().user.avatarMediaId).toBeNull();
    expect(screen.queryByRole('img', { name: 'Ảnh đại diện của Thành Viên' })).toBeNull();
  });

  it('chưa có ảnh đại diện → không hiện nút Gỡ ảnh', async () => {
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/profile');

    await screen.findByLabelText('Đổi ảnh đại diện');
    expect(screen.queryByRole('button', { name: 'Gỡ ảnh' })).toBeNull();
  });

  it('ảnh > 2MB → báo lỗi, không gọi API', async () => {
    const user = userEvent.setup();
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/profile');

    const bigFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'to.png', {
      type: 'image/png',
    });
    await user.upload(await screen.findByLabelText('Đổi ảnh đại diện'), bigFile);

    expect(screen.getByRole('alert')).toHaveTextContent('Ảnh đại diện tối đa 2MB');
  });
});

describe('[bai-13] Thư viện ảnh — tổng quan thư mục', () => {
  it('lưới thư mục: thư mục hệ thống có nhãn, thư mục rỗng vẫn hiện; bấm vào → trang thư mục', async () => {
    const user = userEvent.setup();
    mockLibrary([ORPHAN]);
    signInAs(TEST_USERS.ADMIN);
    const { router } = renderRoute('/admin/media');

    const grid = await screen.findByRole('list', { name: 'Thư mục ảnh' });
    const cards = within(grid).getAllByRole('link');
    expect(cards.map((card) => card.getAttribute('href'))).toEqual([
      '/admin/media/folders/avatars',
      '/admin/media/folders/banners',
      '/admin/media/folders/trong',
    ]);
    expect(cards[0]).toHaveTextContent('Hệ thống');
    expect(cards[1]).toHaveTextContent('1 ảnh · 2 KB');
    expect(cards[2]).toHaveTextContent('Thư mục trống');

    await user.click(cards[1]);
    expect(await screen.findByRole('heading', { level: 1, name: 'banners' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/media/folders/banners');
  });

  it('tạo thư mục: gõ có dấu → tự thành tên hợp lệ → gọi API → mở thư mục mới', async () => {
    const user = userEvent.setup();
    let sentBody;
    mockLibrary([]);
    server.use(
      http.post(`${API_URL}/admin/media/folders`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          { success: true, message: 'Đã tạo thư mục', data: { id: 'f1', name: sentBody.name } },
          { status: 201 },
        );
      }),
    );
    signInAs(TEST_USERS.ADMIN);
    const { router } = renderRoute('/admin/media');

    await user.click(await screen.findByRole('button', { name: 'Thư mục mới' }));
    const dialog = screen.getByRole('dialog', { name: 'Thư mục mới' });
    const input = within(dialog).getByLabelText('Tên thư mục');
    await user.type(input, 'Sự kiện 2026');
    expect(input).toHaveValue('su-kien-2026');
    await user.click(within(dialog).getByRole('button', { name: 'Tạo thư mục' }));

    expect(await screen.findByText('Đã tạo thư mục')).toBeInTheDocument();
    expect(sentBody).toEqual({ name: 'su-kien-2026' });
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/media/folders/su-kien-2026'),
    );
  });

  it('tạo thư mục trùng tên → báo lỗi ngay dưới ô nhập, hộp thoại vẫn mở', async () => {
    const user = userEvent.setup();
    mockLibrary([]);
    server.use(
      http.post(`${API_URL}/admin/media/folders`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'FOLDER_EXISTS', message: 'Tên thư mục đã tồn tại' },
          },
          { status: 409 },
        ),
      ),
    );
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/media');

    await user.click(await screen.findByRole('button', { name: 'Thư mục mới' }));
    const dialog = screen.getByRole('dialog', { name: 'Thư mục mới' });
    await user.type(within(dialog).getByLabelText('Tên thư mục'), 'banners');
    await user.click(within(dialog).getByRole('button', { name: 'Tạo thư mục' }));

    expect(await within(dialog).findByText('Tên thư mục đã tồn tại')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Tên thư mục')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('[bai-13] Thư viện ảnh — trang thư mục', () => {
  it('ảnh kèm trạng thái đang dùng / mồ côi; lọc nhanh lưu trên URL, gửi kèm thư mục', async () => {
    const user = userEvent.setup();
    const requests = mockLibrary([USED, ORPHAN]);
    signInAs(TEST_USERS.ADMIN);
    const { router } = renderRoute('/admin/media/folders/banners');

    const grid = await screen.findByRole('list', { name: 'Danh sách ảnh' });
    expect(within(grid).getByRole('img', { name: 'mat-an.png' })).toHaveAttribute(
      'src',
      `${API_URL}/media/m-used/content`,
    );
    expect(grid).toHaveTextContent('Đang dùng · 1');
    expect(grid).toHaveTextContent('Mồ côi');
    expect(requests[0]).toMatchObject({ folder: 'banners' });

    await user.click(screen.getByRole('radio', { name: 'Mồ côi' }));
    expect(router.state.location.search).toBe('?usage=orphan');
    await waitFor(() =>
      expect(requests.at(-1)).toMatchObject({ folder: 'banners', usage: 'orphan' }),
    );
  });

  it('tải nhiều ảnh: mỗi ảnh presign vào thư mục → PUT R2 → xác nhận; file sai loại báo lỗi riêng', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const steps = [];
    mockLibrary([]);
    server.use(
      http.post(`${API_URL}/admin/media/presign`, async ({ request }) => {
        const body = await request.json();
        steps.push(['presign', body.folder, body.fileName]);
        return HttpResponse.json(
          {
            success: true,
            data: {
              media: { id: `m-${body.fileName}` },
              upload: { url: `https://r2.example/${body.fileName}`, method: 'PUT', headers: {} },
            },
          },
          { status: 201 },
        );
      }),
      http.put('https://r2.example/:name', ({ params }) => {
        steps.push(['r2-put', params.name]);
        return new HttpResponse(null, { status: 200 });
      }),
      http.post(`${API_URL}/media/:id/complete`, ({ params }) => {
        steps.push(['complete', params.id]);
        return HttpResponse.json({ success: true, data: { id: params.id } });
      }),
    );
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/media/folders/banners');

    await screen.findByText('Thư mục trống');
    await user.upload(screen.getAllByLabelText('Tải ảnh lên')[0], [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.webp', { type: 'image/webp' }),
      new File(['c'], 'c.pdf', { type: 'application/pdf' }),
    ]);

    expect(await screen.findByText('Đã tải 2 ảnh vào "banners"')).toBeInTheDocument();
    expect(steps).toEqual([
      ['presign', 'banners', 'a.png'],
      ['r2-put', 'a.png'],
      ['complete', 'm-a.png'],
      ['presign', 'banners', 'b.webp'],
      ['r2-put', 'b.webp'],
      ['complete', 'm-b.webp'],
    ]);
    const queue = screen.getByRole('list', { name: 'Ảnh đang tải lên' });
    expect(within(queue).getByRole('alert')).toHaveTextContent('Chỉ chấp nhận ảnh');
  });

  it('thư mục hệ thống: không có nút tải lên, không xoá được thư mục', async () => {
    mockLibrary([USED]);
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/media/folders/avatars');

    await screen.findByRole('list', { name: 'Danh sách ảnh' });
    expect(screen.queryByLabelText('Tải ảnh lên')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tuỳ chọn thư mục' })).toBeNull();
  });

  it('xoá thư mục rỗng có xác nhận → về trang tổng quan', async () => {
    const user = userEvent.setup();
    let deletedName;
    mockLibrary([]);
    server.use(
      http.delete(`${API_URL}/admin/media/folders/:name`, ({ params }) => {
        deletedName = params.name;
        return HttpResponse.json({ success: true, message: 'Đã xoá thư mục', data: null });
      }),
    );
    signInAs(TEST_USERS.ADMIN);
    const { router } = renderRoute('/admin/media/folders/trong');

    await selectMenuItem(user, { menu: 'Tuỳ chọn thư mục', item: 'Xoá thư mục' });
    const dialog = screen.getByRole('alertdialog', { name: 'Xoá thư mục "trong"?' });
    await user.click(within(dialog).getByRole('button', { name: 'Xoá thư mục' }));

    expect(await screen.findByText('Đã xoá thư mục')).toBeInTheDocument();
    expect(deletedName).toBe('trong');
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/media'));
  });

  it('thư mục không tồn tại → thông báo + lối quay về', async () => {
    mockLibrary([]);
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/media/folders/khong-co');

    expect(await screen.findByText('Không tìm thấy thư mục')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Về thư viện ảnh' })).toHaveAttribute(
      'href',
      '/admin/media',
    );
  });

  it('xoá ảnh đang dùng → server từ chối → hiện nơi dùng kèm link', async () => {
    const user = userEvent.setup();
    mockLibrary([USED]);
    server.use(
      http.delete(`${API_URL}/admin/media/:id`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'MEDIA_IN_USE', message: 'Ảnh đang được sử dụng', details: USED.usages },
          },
          { status: 409 },
        ),
      ),
    );
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/media/folders/avatars');

    await selectMenuItem(user, { menu: 'Thao tác với mat-an.png', item: 'Xoá' });
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xoá' }));

    const dialog = await screen.findByRole('alertdialog', { name: 'Ảnh đang được sử dụng' });
    expect(within(dialog).getByRole('link', { name: 'Ảnh đại diện của An' })).toHaveAttribute(
      'href',
      '/admin/users?q=an%40example.com',
    );
  });

  it('"Tất cả ảnh" lọc mồ côi → dọn ảnh mồ côi có xác nhận → báo số ảnh đã dọn', async () => {
    const user = userEvent.setup();
    mockLibrary([ORPHAN]);
    server.use(
      http.post(`${API_URL}/admin/media/cleanup-orphans`, () =>
        HttpResponse.json({
          success: true,
          message: 'Đã dọn 1 ảnh mồ côi',
          data: { deletedCount: 1 },
        }),
      ),
    );
    signInAs(TEST_USERS.ADMIN);
    renderRoute('/admin/media/all?usage=orphan');

    await user.click(await screen.findByRole('button', { name: 'Dọn ảnh mồ côi' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Dọn' }));

    expect(await screen.findByText('Đã dọn 1 ảnh mồ côi')).toBeInTheDocument();
  });
});
