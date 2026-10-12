import { useMutation, useQuery } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { ApiError } from '@/shared/lib/apiError';
import { describeNotImplemented, notImplemented } from '@/shared/lib/practice';
import { renderWithProviders } from '../utils';

function MutationButton() {
  const mutation = useMutation({ mutationFn: async () => notImplemented('bai-04') });
  return (
    <button type="button" onClick={() => mutation.mutate()}>
      Gửi
    </button>
  );
}

function QueryPanel() {
  useQuery({ queryKey: ['practice-test'], queryFn: async () => notImplemented('bai-14') });
  return null;
}

describe('Thông báo tính năng chưa làm (nhánh practice)', () => {
  it('đọc mã bài từ thông điệp backend và trỏ tới file đề bài', () => {
    const error = new ApiError({
      status: 501,
      code: ERROR_CODES.NOT_IMPLEMENTED,
      message: 'Chức năng chưa được hoàn thành — xem docs/practice (bai-07)',
    });

    expect(describeNotImplemented(error)).toEqual({
      lesson: 'bai-07',
      description: 'Vui lòng xem docs/practice/bai-07-quan-ly-phien-dang-nhap.md',
    });
  });

  it('bỏ qua lỗi không phải NOT_IMPLEMENTED', () => {
    const error = new ApiError({ status: 400, code: ERROR_CODES.VALIDATION_ERROR, message: 'x' });

    expect(describeNotImplemented(error)).toBeNull();
  });

  it('mutation chưa làm → hiện toast chỉ tới đề bài', async () => {
    renderWithProviders(<MutationButton />);

    await userEvent.click(await screen.findByRole('button', { name: 'Gửi' }));

    expect(await screen.findByText('Tính năng chưa được thực hiện')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng xem docs/practice/bai-04-dang-nhap.md')).toBeInTheDocument();
  });

  it('query chưa làm → hiện toast chỉ tới đề bài', async () => {
    renderWithProviders(<QueryPanel />);

    expect(
      await screen.findByText('Vui lòng xem docs/practice/bai-14-lich-tu-dong-va-thong-ke.md'),
    ).toBeInTheDocument();
  });
});
