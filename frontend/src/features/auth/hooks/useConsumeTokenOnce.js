// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 03.
import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

/**
 * **[BÀI 03]** Gửi token dùng 1 lần (xác thực email, magic link…) lên API **đúng một lần** khi
 * trang mở. Bài 09 dùng lại hook này cho magic link.
 *
 * TODO(bai-03): viết thân của `useEffect` bên dưới.
 * 1. Không có `token` → không gọi gì cả.
 * 2. Đã gọi rồi (`hasStartedRef.current`) → không gọi lại.
 * 3. Còn lại: đánh dấu `hasStartedRef.current = true` **trước**, rồi `mutate({ token })`.
 *
 * Vì sao cần `useRef`? React Strict Mode cố ý chạy effect **hai lần** ở development để lộ ra
 * những effect không chịu được việc chạy lại. Token ở đây chỉ dùng được một lần, nên lần chạy
 * thứ hai nhận "token đã dùng" và trang báo lỗi dù lần đầu đã thành công. Giá trị trong `useRef`
 * sống xuyên qua hai lần chạy đó (khác biến thường, bị tạo lại mỗi lần render), nên dùng nó làm
 * cờ chặn. Có test cho việc này: _"gọi API đúng 1 lần (kể cả StrictMode)"_.
 *
 * ⚠️ Đừng bỏ `hasStartedRef` rồi để mảng phụ thuộc rỗng (`[]`) — Strict Mode vẫn chạy hai lần.
 *
 * @param {Function} mutationFn hàm API nhận `{ token }`
 * @param {string|null} token token lấy từ URL
 * @returns {Object} kết quả useMutation (isPending, isSuccess, isError, error, data)
 */
export function useConsumeTokenOnce(mutationFn, token) {
  const mutation = useMutation({ mutationFn });
  const { mutate } = mutation;
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // TODO(bai-03): gọi `mutate({ token })` đúng một lần (xem mô tả phía trên).
  }, [token, mutate]);

  return mutation;
}
