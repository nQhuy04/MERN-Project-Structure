import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { API_URL, PUBLIC_SETTINGS } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute, selectMenuItem, signInAs } from '../utils';

const R2_UPLOAD_URL = 'https://r2.example/upload?X-Amz-Signature=abc';

/**
 * `window.location.assign` không ghi đè trực tiếp được trong jsdom → thay cả object `location`
 * qua getter. Setup tự khôi phục sau mỗi test (`vi.restoreAllMocks`).
 * @returns {Object} hàm giả đã thay cho `assign`
 */
function mockLocationAssign() {
  const assign = vi.fn();
  vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, assign });
  return assign;
}

function mockStorageEnabled(enabled) {
  server.use(
    http.get(`${API_URL}/settings/public`, () =>
      HttpResponse.json({
        success: true,
        data: { ...PUBLIC_SETTINGS, features: { ...PUBLIC_SETTINGS.features, storage: enabled } },
      }),
    ),
  );
}

/** Giả lập API files + R2, ghi lại thứ tự các bước upload. */
function mockFilesServer(initialFiles = []) {
  let files = [...initialFiles];
  const steps = [];
  server.use(
    http.get(`${API_URL}/files`, () =>
      HttpResponse.json({
        success: true,
        data: files,
        meta: { page: 1, limit: 20, total: files.length, totalPages: 1 },
      }),
    ),
    http.post(`${API_URL}/files/presign`, async ({ request }) => {
      const body = await request.json();
      steps.push(['presign', body]);
      return HttpResponse.json(
        {
          success: true,
          data: {
            file: { id: 'f-new', originalName: body.fileName },
            upload: {
              url: R2_UPLOAD_URL,
              method: 'PUT',
              headers: { 'Content-Type': body.contentType },
            },
          },
        },
        { status: 201 },
      );
    }),
    http.put('https://r2.example/upload', ({ request }) => {
      steps.push([
        'r2-put',
        request.headers.get('content-type'),
        request.headers.get('authorization'),
      ]);
      return new HttpResponse(null, { status: 200 });
    }),
    http.post(`${API_URL}/files/:id/complete`, ({ params }) => {
      steps.push(['complete', params.id]);
      const file = {
        id: 'f-new',
        originalName: 'anh.png',
        size: 4,
        createdAt: '2026-09-29T00:00:00Z',
      };
      files = [file, ...files];
      return HttpResponse.json({ success: true, message: 'Tải lên thành công', data: file });
    }),
    http.delete(`${API_URL}/files/:id`, ({ params }) => {
      files = files.filter((file) => file.id !== params.id);
      return HttpResponse.json({ success: true, message: 'Đã xoá file', data: null });
    }),
  );
  return steps;
}

describe('[bai-12] Tệp của tôi', () => {
  it('upload: xin URL → PUT thẳng lên R2 (không kèm access token) → xác nhận → danh sách cập nhật', async () => {
    const user = userEvent.setup();
    mockStorageEnabled(true);
    const steps = mockFilesServer();
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/files');

    await screen.findByText('Bạn chưa có file nào.');
    const file = new File(['data'], 'anh.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Tải file lên'), file);

    expect(await screen.findByText('Đã tải lên "anh.png"')).toBeInTheDocument();
    expect(steps).toEqual([
      ['presign', { fileName: 'anh.png', contentType: 'image/png', size: 4 }],
      ['r2-put', 'image/png', null],
      ['complete', 'f-new'],
    ]);
    const list = await screen.findByRole('list', { name: 'File của tôi' });
    expect(within(list).getByText('anh.png')).toBeInTheDocument();
  });

  it('loại file không cho phép → báo lỗi ngay, không gọi API', async () => {
    const user = userEvent.setup({ applyAccept: false });
    mockStorageEnabled(true);
    const steps = mockFilesServer();
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/files');

    await screen.findByText('Bạn chưa có file nào.');
    await user.upload(
      screen.getByLabelText('Tải file lên'),
      new File(['x'], 'virus.exe', { type: 'application/x-msdownload' }),
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Chỉ chấp nhận ảnh');
    expect(steps).toEqual([]);
  });

  it('xoá file có xác nhận', async () => {
    const user = userEvent.setup();
    mockStorageEnabled(true);
    mockFilesServer([
      { id: 'f1', originalName: 'hop-dong.pdf', size: 2048, createdAt: '2026-09-29T00:00:00Z' },
    ]);
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/files');

    await selectMenuItem(user, { menu: 'Thao tác với hop-dong.pdf', item: 'Xoá' });
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Xoá' }));

    expect(await screen.findByText('Đã xoá file')).toBeInTheDocument();
    expect(await screen.findByText('Bạn chưa có file nào.')).toBeInTheDocument();
  });

  it('tải về: xin presigned URL rồi chuyển trình duyệt sang URL đó', async () => {
    const user = userEvent.setup();
    mockStorageEnabled(true);
    mockFilesServer([
      { id: 'f1', originalName: 'hop-dong.pdf', size: 2048, createdAt: '2026-09-29T00:00:00Z' },
    ]);
    let downloadedId;
    server.use(
      http.get(`${API_URL}/files/:id/download`, ({ params }) => {
        downloadedId = params.id;
        return HttpResponse.json({ success: true, data: { url: 'https://r2.example/tai-ve' } });
      }),
    );
    const assign = mockLocationAssign();
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/files');

    await user.click(await screen.findByRole('button', { name: 'Tải về' }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://r2.example/tai-ve'));
    expect(downloadedId).toBe('f1');
  });

  it('tải về file đã bị xoá → thông báo lỗi, không chuyển trang', async () => {
    const user = userEvent.setup();
    mockStorageEnabled(true);
    mockFilesServer([
      { id: 'f1', originalName: 'hop-dong.pdf', size: 2048, createdAt: '2026-09-29T00:00:00Z' },
    ]);
    server.use(
      http.get(`${API_URL}/files/:id/download`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'RESOURCE_NOT_FOUND', message: 'Không tìm thấy file' } },
          { status: 404 },
        ),
      ),
    );
    const assign = mockLocationAssign();
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/files');

    await user.click(await screen.findByRole('button', { name: 'Tải về' }));

    expect(await screen.findByText('Không tìm thấy file')).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it('server chưa cấu hình kho lưu trữ → thông báo, không có nút tải lên', async () => {
    mockStorageEnabled(false);
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/files');

    expect(await screen.findByText(/chưa được cấu hình/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Tải file lên')).toBeNull();
  });
});
