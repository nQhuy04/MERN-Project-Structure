import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { API_URL } from '../msw/handlers';
import { server } from '../msw/server';
import { TEST_USERS, renderRoute, signInAs } from '../utils';

describe('[bai-05] Trang hồ sơ', () => {
  it('đổi tên → gọi API, thông báo thành công, header cập nhật tên mới', async () => {
    const user = userEvent.setup();
    let receivedBody;
    server.use(
      http.patch(`${API_URL}/users/me`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          success: true,
          message: 'Cập nhật hồ sơ thành công',
          data: { ...TEST_USERS.MEMBER, name: receivedBody.name },
        });
      }),
    );
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/profile');

    const nameInput = await screen.findByLabelText('Họ tên');
    await user.clear(nameInput);
    await user.type(nameInput, 'Tên Mới');
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));

    expect(await screen.findByText('Cập nhật hồ sơ thành công')).toBeInTheDocument();
    expect(receivedBody).toEqual({ name: 'Tên Mới' });
    expect(screen.getByRole('button', { name: /Tên Mới/ })).toBeInTheDocument();
    expect(useAuthStore.getState().user.name).toBe('Tên Mới');
  });

  it('chưa sửa gì → nút lưu bị khoá; tên rỗng → báo lỗi', async () => {
    const user = userEvent.setup();
    signInAs(TEST_USERS.MEMBER);
    renderRoute('/account/profile');

    const saveButton = await screen.findByRole('button', { name: 'Lưu thay đổi' });
    expect(saveButton).toBeDisabled();

    await user.clear(screen.getByLabelText('Họ tên'));
    await user.click(saveButton);
    expect(await screen.findByText('Vui lòng nhập tên')).toBeInTheDocument();
  });
});
