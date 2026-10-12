import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiStatusCard } from '@/features/health';
import { API_URL, HEALTH_OK } from '../msw/handlers';
import { server } from '../msw/server';
import { renderWithProviders } from '../utils';

function mockHealthUnavailable() {
  server.use(
    http.get(`${API_URL}/health`, () =>
      HttpResponse.json(
        {
          success: false,
          error: { code: 'SERVICE_UNAVAILABLE', message: 'Cơ sở dữ liệu không phản hồi' },
        },
        { status: 503 },
      ),
    ),
  );
}

describe('[bai-01] ApiStatusCard — trạng thái hệ thống', () => {
  it('hiện loading rồi hiện trạng thái khi API và DB hoạt động', async () => {
    renderWithProviders(<ApiStatusCard />);

    expect(await screen.findByText('Đang kiểm tra kết nối API...')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Hệ thống hoạt động bình thường' }),
    ).toBeInTheDocument();
    expect(screen.getByText(`${HEALTH_OK.uptime} giây`)).toBeInTheDocument();
  });

  it('DB không phản hồi → thông báo theo mã SERVICE_UNAVAILABLE', async () => {
    mockHealthUnavailable();

    renderWithProviders(<ApiStatusCard />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('API đang chạy nhưng cơ sở dữ liệu không phản hồi');
    expect(alert).toHaveTextContent('Cơ sở dữ liệu không phản hồi');
  });

  it('không gọi được API → thông báo NETWORK_ERROR', async () => {
    server.use(http.get(`${API_URL}/health`, () => HttpResponse.error()));

    renderWithProviders(<ApiStatusCard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Không kết nối được API');
  });

  it('bấm "Thử lại" gọi lại API và hiện kết quả mới', async () => {
    const user = userEvent.setup();
    mockHealthUnavailable();
    renderWithProviders(<ApiStatusCard />);
    await screen.findByRole('alert');

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(
      await screen.findByRole('heading', { name: 'Hệ thống hoạt động bình thường' }),
    ).toBeInTheDocument();
  });
});
