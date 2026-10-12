import { FileList } from '@/features/files/components/FileList';
import {
  FILE_RULES_TEXT,
  FileUploadButton,
  FileUploadStatus,
} from '@/features/files/components/FileUploader';
import { useFileUploader } from '@/features/files/hooks/useFileUploader';
import { useFiles } from '@/features/files/hooks/useFiles';
import { usePublicSettings } from '@/features/settings';
import { Alert } from '@/shared/components/ui/Alert';
import { DropZone } from '@/shared/components/ui/DropZone';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { FileIcon } from '@/shared/components/ui/icons';
import { useListSearchParams } from '@/shared/hooks/useListSearchParams';

const LIST_DEFAULTS = Object.freeze({ page: 1 });
const PAGE_TITLE = 'Tệp của tôi';

/** Nội dung trang "Tệp của tôi". */
function FilesContent() {
  const [params, updateParams] = useListSearchParams(LIST_DEFAULTS);
  const filesQuery = useFiles(params.page);
  const uploader = useFileUploader();

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE_TITLE}
        description={`${FILE_RULES_TEXT} Kéo thả file vào danh sách để tải lên nhanh.`}
        actions={<FileUploadButton uploader={uploader} />}
      />
      <FileUploadStatus uploader={uploader} />

      <DropZone onFiles={uploader.upload} disabled={uploader.isPending} hint="Thả file để tải lên">
        {filesQuery.isPending && (
          <div role="status" aria-label="Đang tải danh sách file..." className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        )}
        {filesQuery.isError && (
          <ErrorState
            title="Không tải được danh sách file"
            message={filesQuery.error.message}
            onRetry={() => filesQuery.refetch()}
            isRetrying={filesQuery.isFetching}
          />
        )}
        {filesQuery.isSuccess && filesQuery.data.items.length === 0 && (
          <EmptyState
            icon={FileIcon}
            title="Bạn chưa có file nào."
            description="Tải file lên bằng nút phía trên hoặc kéo thả vào đây."
          />
        )}
        {filesQuery.isSuccess && filesQuery.data.items.length > 0 && (
          <div className="space-y-4">
            <FileList files={filesQuery.data.items} />
            <Pagination
              meta={filesQuery.data.meta}
              onPageChange={(page) => updateParams({ page })}
            />
          </div>
        )}
      </DropZone>
    </div>
  );
}

/** Tệp của tôi — chỉ khi server đã cấu hình kho lưu trữ. */
export function MyFiles() {
  const { data, isPending } = usePublicSettings();

  if (isPending) return <Skeleton className="h-10 w-48" />;
  if (!data?.features.storage) {
    return (
      <div className="space-y-6">
        <PageHeader title={PAGE_TITLE} />
        <Alert tone="neutral">Chức năng lưu trữ file chưa được cấu hình trên máy chủ.</Alert>
      </div>
    );
  }
  return <FilesContent />;
}
