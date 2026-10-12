// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 13.
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import {
  completeAvatarUpload,
  presignAvatar,
  updateAvatar,
} from '@/features/account/api/account.api';
import { uploadToPresignedUrl } from '@/shared/lib/directUpload';
import { notImplemented } from '@/shared/lib/practice';

/**
 * **[BÀI 13]** Tải ảnh lên (presign → PUT thẳng R2 → xác nhận) rồi **đặt làm ảnh đại diện**.
 *
 * User của phiên là client state (Zustand) nên phải `setUser` bằng dữ liệu server trả về — header
 * và menu hiện ảnh mới ngay, không phải tải lại trang (giống `useUpdateProfile` ở bài 05).
 */
export function useChangeAvatar() {
  const setUser = useAuthStore((state) => state.setUser);

  // TODO(bai-13): `mutationFn` nhận `file` và chạy **bốn** bước, rồi `onSuccess: (body) =>
  // setUser(body.data)`.
  // 1. `presignAvatar({ fileName: file.name, contentType: file.type, size: file.size })`.
  // 2. `uploadToPresignedUrl({ upload, file })` — PUT thẳng lên R2 (không cần tiến trình, ảnh nhỏ).
  // 3. `completeAvatarUpload(media.id)`.
  // 4. `return updateAvatar(media.id)` — gán ảnh làm avatar.
  // Bước 3 và 4 là hai việc khác nhau: "ảnh đã lên kho" và "ảnh này là avatar của tôi".
  return useMutation({
    mutationFn: async () => notImplemented('bai-13'),
  });
}

/**
 * **[BÀI 13]** Gỡ ảnh đại diện.
 *
 * TODO(bai-13): `mutationFn: () => updateAvatar(null)` và `onSuccess: (body) => setUser(body.data)`.
 * Gỡ avatar chỉ là đặt `mediaId` thành `null` — **không** xoá ảnh khỏi kho. Ảnh cũ trở thành "mồ
 * côi" và được job dọn sau 24 giờ; nhờ vậy gỡ nhầm thì gán lại được.
 */
export function useRemoveAvatar() {
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({ mutationFn: () => notImplemented('bai-13') });
}
