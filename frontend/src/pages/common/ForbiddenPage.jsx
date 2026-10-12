import { StatusScreen } from '@/pages/common/StatusScreen';
import { ButtonLink } from '@/shared/components/ui/Button';
import { ArrowLeftIcon } from '@/shared/components/ui/icons';
import { ROUTES } from '@/shared/constants/routes';

export function ForbiddenPage() {
  return (
    <StatusScreen
      code="403"
      tone="danger"
      title="Bạn không có quyền truy cập trang này"
      description="Liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn."
      actions={
        <ButtonLink to={ROUTES.DASHBOARD} variant="secondary" icon={ArrowLeftIcon}>
          Về trang của tôi
        </ButtonLink>
      }
    />
  );
}
