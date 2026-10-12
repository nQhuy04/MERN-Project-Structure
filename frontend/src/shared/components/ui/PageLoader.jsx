import { Spinner } from '@/shared/components/ui/Spinner';

/** Loading toàn màn hình (tải route lazy lần đầu, khôi phục phiên...). */
export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <Spinner />
    </div>
  );
}
