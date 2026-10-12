import { usePublicSettings } from '@/features/settings';
import { Alert } from '@/shared/components/ui/Alert';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Skeleton } from '@/shared/components/ui/Skeleton';

/**
 * Chỉ hiện thư viện ảnh khi server đã cấu hình kho lưu trữ.
 * @param {Object} props
 * @param {string} props.title tiêu đề trang khi chưa cấu hình
 */
export function StorageGate({ title, children }) {
  const { data, isPending } = usePublicSettings();

  if (isPending) return <Skeleton className="h-10 w-64" />;
  if (!data?.features.storage) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} />
        <Alert tone="neutral">Chức năng lưu trữ ảnh chưa được cấu hình trên máy chủ.</Alert>
      </div>
    );
  }
  return children;
}
