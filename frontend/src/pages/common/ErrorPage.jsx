import { isRouteErrorResponse, useRouteError } from 'react-router';
import { NotFoundPage } from '@/pages/common/NotFoundPage';
import { StatusScreen } from '@/pages/common/StatusScreen';
import { Button, ButtonLink } from '@/shared/components/ui/Button';
import { AlertTriangleIcon, RefreshIcon } from '@/shared/components/ui/icons';
import { ROUTES } from '@/shared/constants/routes';

const HTTP_NOT_FOUND = 404;

/** errorElement của route gốc: bắt lỗi render/loader, không để trắng trang. */
export function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === HTTP_NOT_FOUND) {
    return <NotFoundPage />;
  }

  return (
    <StatusScreen
      role="alert"
      icon={AlertTriangleIcon}
      title="Đã có lỗi xảy ra"
      description="Trang gặp sự cố ngoài ý muốn. Vui lòng tải lại hoặc quay về trang chủ."
      actions={
        <>
          <Button icon={RefreshIcon} onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
          <ButtonLink to={ROUTES.HOME} variant="secondary">
            Về trang chủ
          </ButtonLink>
        </>
      }
    />
  );
}
