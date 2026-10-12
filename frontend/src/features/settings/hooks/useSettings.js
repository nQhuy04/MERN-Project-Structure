// check-conventions: allow-unused-imports — `settingsKeys` bên dưới là gợi ý cho bài 09.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminSettings,
  getPublicSettings,
  sendTestEmail,
  settingsKeys,
  updateSettings,
} from '@/features/settings/api/settings.api';

const PUBLIC_SETTINGS_STALE_MS = 5 * 60 * 1000;

/** Cấu hình công khai (ít thay đổi → cache 5 phút). */
export function usePublicSettings() {
  return useQuery({
    queryKey: settingsKeys.public(),
    queryFn: getPublicSettings,
    staleTime: PUBLIC_SETTINGS_STALE_MS,
  });
}

/**
 * Một setting công khai; `undefined` khi đang tải (nơi dùng nên ẩn tính năng cho tới khi biết).
 * @param {string} key
 * @returns {*}
 */
export function usePublicSetting(key) {
  const { data } = usePublicSettings();
  return data?.settings[key];
}

/** Toàn bộ setting cho trang quản trị. */
export function useAdminSettings() {
  return useQuery({ queryKey: settingsKeys.admin(), queryFn: getAdminSettings });
}

/**
 * **[BÀI 09]** Lưu setting; xong thì làm mới cả bản quản trị lẫn bản công khai.
 *
 * TODO(bai-09): thêm `onSuccess: (body) => {...}` làm **hai** việc:
 * 1. `queryClient.setQueryData(settingsKeys.admin(), body.data)` — server đã trả danh sách mới
 *    nên ghi thẳng vào cache, không cần gọi lại API.
 * 2. `queryClient.invalidateQueries({ queryKey: settingsKeys.public() })` — bản công khai
 *    (`usePublicSettings`) cache 5 phút; không đánh dấu cũ thì tắt đăng ký xong, trang đăng ký
 *    vẫn hiện nút Đăng ký cho tới 5 phút sau.
 *
 * Hai cách khác nhau có chủ đích: chỗ nào **đã có** dữ liệu mới thì `setQueryData`, chỗ nào chỉ
 * biết "dữ liệu cũ rồi" thì `invalidateQueries`.
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: updateSettings });
}

/** Gửi email thử qua một kênh — không đổi dữ liệu nào nên không cần làm mới cache. */
export function useSendTestEmail() {
  return useMutation({ mutationFn: sendTestEmail });
}
