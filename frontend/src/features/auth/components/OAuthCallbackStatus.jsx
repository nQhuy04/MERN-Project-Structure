// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 10.
import { Navigate, useSearchParams } from 'react-router';
import { useCurrentUser } from '@/features/auth/store/authStore';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { TextLink } from '@/shared/components/ui/TextLink';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { ROUTES } from '@/shared/constants/routes';

const ERROR_MESSAGES = {
  [ERROR_CODES.OAUTH_CANCELLED]: 'Bạn đã huỷ đăng nhập bằng Google.',
  [ERROR_CODES.OAUTH_STATE_INVALID]: 'Phiên đăng nhập Google đã hết hạn, vui lòng thử lại.',
  [ERROR_CODES.OAUTH_EMAIL_NOT_VERIFIED]: 'Email Google của bạn chưa được Google xác minh.',
  [ERROR_CODES.REGISTRATION_DISABLED]: 'Hệ thống đang tạm dừng đăng ký tài khoản mới.',
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên.',
};
const DEFAULT_ERROR_MESSAGE = 'Không thể đăng nhập bằng Google, vui lòng thử lại.';

/**
 * **[BÀI 10]** Trang Google chuyển về (`/auth/callback`).
 *
 * Backend **không** trả access token qua URL — nó chỉ đặt cookie refresh rồi redirect về đây. Vì
 * đây là một lần tải trang mới, `SessionRestorer` (bài 06) đã gọi `/auth/refresh` và lấy phiên
 * trước khi component này render. Nên ở đây chỉ còn hai việc: **chuyển vào dashboard** khi đã có
 * user, hoặc **hiển thị lỗi** theo `?error=CODE`.
 *
 * Component này chạy lúc **render**, nên mọi nhánh đều phải trả về JSX hợp lệ — không được ném
 * lỗi, nếu không cả trang trắng.
 */
export function OAuthCallbackStatus() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('error');
  const currentUser = useCurrentUser();

  // TODO(bai-10): không có `errorCode` VÀ đã có `currentUser` → `<Navigate to={ROUTES.DASHBOARD}
  // replace />`. (Chưa có `currentUser` mà cũng không có lỗi nghĩa là `SessionRestorer` đang
  // khôi phục phiên — cứ để component render tiếp, nó sẽ render lại khi có user.)

  return (
    <div className="space-y-4">
      <ErrorState
        title="Đăng nhập bằng Google không thành công"
        // TODO(bai-10): tra `errorCode` trong `ERROR_MESSAGES`; không khớp mã nào (hoặc mã lạ do
        // phiên bản backend khác) → dùng `DEFAULT_ERROR_MESSAGE`.
        message={DEFAULT_ERROR_MESSAGE}
      />
      <p className="text-sm">
        <TextLink to={ROUTES.AUTH.LOGIN}>Về trang đăng nhập</TextLink>
      </p>
    </div>
  );
}
