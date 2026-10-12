import { StatusScreen } from '@/pages/common/StatusScreen';
import { ButtonLink } from '@/shared/components/ui/Button';
import { ArrowLeftIcon } from '@/shared/components/ui/icons';
import { ROUTES } from '@/shared/constants/routes';

export function NotFoundPage() {
  return (
    <StatusScreen
      code="404"
      title="Không tìm thấy trang"
      description="Đường dẫn không tồn tại hoặc đã bị thay đổi."
      actions={
        <ButtonLink to={ROUTES.HOME} variant="secondary" icon={ArrowLeftIcon}>
          Về trang chủ
        </ButtonLink>
      }
    />
  );
}
