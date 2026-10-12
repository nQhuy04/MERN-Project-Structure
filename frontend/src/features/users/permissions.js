// check-conventions: allow-unused-imports — `USER_ROLES` bên dưới là gợi ý cho bài 11.
import { USER_ROLES } from '@/shared/constants/roles';

/**
 * **[BÀI 11]** Thao tác người đang đăng nhập được phép làm trên một user — **CHỈ để ẩn/hiện nút**
 * cho gọn giao diện. Backend (`usersAdmin.service`) mới là nơi kiểm tra quyền thật sự.
 *
 * Hàm này **lặp lại** ma trận quyền của backend. Đó là trùng lặp có chủ đích, và cũng là rủi ro:
 * hai nơi có thể lệch nhau. Vì vậy có một nhóm test riêng ở frontend (`getAllowedActions — ẩn/hiện
 * nút theo quyền (khớp backend)`) đối chiếu từng ô của ma trận.
 * @param {Object} actor user đang đăng nhập
 * @param {Object} target user trong danh sách
 * @returns {Object} `{ canLock, canChangeRole }`
 */
export function getAllowedActions(actor, target) {
  // TODO(bai-11): trả về quyền thật, khớp với `loadManageableTarget` + `LOCKABLE_TARGET_ROLES`
  // của backend:
  // - chính mình, hoặc đối tượng là SUPER_ADMIN → cả hai đều `false`;
  // - `canLock`: actor là SUPER_ADMIN, hoặc đối tượng là MEMBER;
  // - `canChangeRole`: chỉ SUPER_ADMIN.
  // Trả mặc định an toàn (ẩn hết nút) khi chưa làm — hàm này chạy lúc render, ném lỗi ở đây là
  // vỡ cả bảng.
  return { canLock: false, canChangeRole: false };
}
