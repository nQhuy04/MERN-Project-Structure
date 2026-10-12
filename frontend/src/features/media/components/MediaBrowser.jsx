import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { MediaGrid } from '@/features/media/components/MediaGrid';
import { StorageGate } from '@/features/media/components/StorageGate';
import { UploadQueue } from '@/features/media/components/UploadQueue';
import {
  MEDIA_IMAGE_TYPES,
  MEDIA_LIST_DEFAULTS,
  MEDIA_SORT_LABELS,
  MEDIA_USAGE_OPTIONS,
} from '@/features/media/constants';
import {
  useCleanupOrphanMedia,
  useDeleteMediaFolder,
  useMediaFolders,
  useMediaList,
  useMediaUploadQueue,
} from '@/features/media/hooks/useMedia';
import { Badge } from '@/shared/components/ui/Badge';
import { Button, ButtonLink } from '@/shared/components/ui/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { DropZone } from '@/shared/components/ui/DropZone';
import { DropdownMenu } from '@/shared/components/ui/DropdownMenu';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { FileButton } from '@/shared/components/ui/FileButton';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { Pagination } from '@/shared/components/ui/Pagination';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { Select } from '@/shared/components/ui/Select';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Toolbar } from '@/shared/components/ui/Toolbar';
import {
  ArrowLeftIcon,
  FolderIcon,
  ImageIcon,
  MoreHorizontalIcon,
  SparklesIcon,
  TrashIcon,
  UploadIcon,
} from '@/shared/components/ui/icons';
import { ROUTES } from '@/shared/constants/routes';
import { formatFileSize } from '@/shared/lib/format';
import { useListSearchParams } from '@/shared/hooks/useListSearchParams';

const ACCEPT = Object.keys(MEDIA_IMAGE_TYPES).join(',');
const TYPE_OPTIONS = [
  { value: '', label: 'Mọi định dạng' },
  ...Object.entries(MEDIA_IMAGE_TYPES).map(([value, label]) => ({ value, label })),
];
const SORT_OPTIONS = Object.entries(MEDIA_SORT_LABELS).map(([value, label]) => ({ value, label }));

/**
 * Bộ lọc ảnh: tên (tự áp dụng), đang dùng / mồ côi, định dạng, sắp xếp — lưu trên URL.
 * @param {Object} props `{ params, onChange, onReset, actions }`
 */
function MediaToolbar({ params, onChange, onReset, actions }) {
  return (
    <Toolbar
      label="Lọc ảnh"
      isFiltered={Boolean(params.q || params.type || params.usage)}
      onReset={onReset}
      actions={actions}
    >
      <SearchInput
        label="Tên ảnh"
        placeholder="Tìm theo tên ảnh..."
        value={params.q}
        onSearch={(q) => onChange({ q })}
        className="w-full sm:w-64"
      />
      <SegmentedControl
        label="Sử dụng"
        value={params.usage}
        options={MEDIA_USAGE_OPTIONS}
        onChange={(usage) => onChange({ usage })}
      />
      <Select
        aria-label="Định dạng"
        value={params.type}
        options={TYPE_OPTIONS}
        onChange={(event) => onChange({ type: event.target.value })}
        className="min-w-36 flex-1 sm:w-40 sm:flex-none"
      />
      <Select
        aria-label="Sắp xếp"
        value={params.sort}
        options={SORT_OPTIONS}
        onChange={(event) => onChange({ sort: event.target.value })}
        className="min-w-36 flex-1 sm:w-48 sm:flex-none"
      />
    </Toolbar>
  );
}

/**
 * @param {Object} props
 * @param {string} [props.folder] bỏ trống = "Tất cả ảnh"
 */
function BrowserContent({ folder }) {
  const navigate = useNavigate();
  const [params, updateParams] = useListSearchParams(MEDIA_LIST_DEFAULTS);
  const mediaQuery = useMediaList({ ...params, folder });
  const foldersQuery = useMediaFolders();
  const uploadQueue = useMediaUploadQueue(folder);
  const cleanupMutation = useCleanupOrphanMedia();
  const deleteFolderMutation = useDeleteMediaFolder();
  const [confirm, setConfirm] = useState(null); // 'cleanup' | 'delete-folder' | null

  const folderInfo = folder ? foldersQuery.data?.find((item) => item.name === folder) : null;
  const canUpload = Boolean(folderInfo && !folderInfo.isSystem);
  const isFiltered = Boolean(params.q || params.type || params.usage);
  const resetFilters = () => updateParams({ q: '', type: '', usage: '' });

  if (folder && foldersQuery.isSuccess && !folderInfo) {
    return (
      <EmptyState
        icon={FolderIcon}
        title="Không tìm thấy thư mục"
        description={`Thư mục "${folder}" không tồn tại hoặc đã bị xoá.`}
        action={
          <ButtonLink to={ROUTES.ADMIN.MEDIA} variant="secondary" icon={ArrowLeftIcon}>
            Về thư viện ảnh
          </ButtonLink>
        }
      />
    );
  }

  const upload = async (files) => {
    const uploadedCount = await uploadQueue.enqueue(files);
    if (uploadedCount > 0) toast.success(`Đã tải ${uploadedCount} ảnh vào "${folder}"`);
  };

  const handleCleanup = () => {
    cleanupMutation.mutate(undefined, {
      onSuccess: (body) => toast.success(body.message),
      onError: (error) => toast.error(error.message),
      onSettled: () => setConfirm(null),
    });
  };

  const handleDeleteFolder = () => {
    deleteFolderMutation.mutate(folder, {
      onSuccess: (body) => {
        toast.success(body.message);
        navigate(ROUTES.ADMIN.MEDIA);
      },
      onError: (error) => toast.error(error.message),
      onSettled: () => setConfirm(null),
    });
  };

  const uploadButton = canUpload && (
    <FileButton
      icon={UploadIcon}
      accept={ACCEPT}
      multiple
      onFiles={upload}
      isLoading={uploadQueue.isUploading}
    >
      {uploadQueue.isUploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
    </FileButton>
  );

  const description = folderInfo ? (
    <span className="flex flex-wrap items-center gap-2">
      {folderInfo.isSystem && <Badge>Hệ thống</Badge>}
      {folderInfo.mediaCount} ảnh · {formatFileSize(folderInfo.totalSize)}
      {folderInfo.isSystem && ' · Ảnh vào đây qua luồng riêng (vd. người dùng đổi ảnh đại diện).'}
    </span>
  ) : (
    !folder && 'Ảnh ở mọi thư mục. Tải ảnh lên bằng cách mở một thư mục.'
  );

  const items = mediaQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={folder ?? 'Tất cả ảnh'}
        description={description}
        actions={
          <>
            {uploadButton}
            {canUpload && (
              <DropdownMenu
                label="Tuỳ chọn thư mục"
                trigger={<MoreHorizontalIcon />}
                items={[
                  {
                    label: 'Xoá thư mục',
                    icon: TrashIcon,
                    tone: 'danger',
                    onSelect: () => setConfirm('delete-folder'),
                  },
                ]}
              />
            )}
          </>
        }
      />

      <MediaToolbar
        params={params}
        onChange={updateParams}
        onReset={resetFilters}
        actions={
          params.usage === 'orphan' && (
            <Button variant="secondary" icon={SparklesIcon} onClick={() => setConfirm('cleanup')}>
              Dọn ảnh mồ côi
            </Button>
          )
        }
      />

      <UploadQueue queue={uploadQueue} />

      <DropZone onFiles={upload} disabled={!canUpload} hint={`Thả ảnh để tải vào "${folder}"`}>
        {mediaQuery.isPending && (
          <div
            role="status"
            aria-label="Đang tải ảnh..."
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        )}
        {mediaQuery.isError && (
          <ErrorState
            title="Không tải được ảnh"
            message={mediaQuery.error.message}
            onRetry={() => mediaQuery.refetch()}
            isRetrying={mediaQuery.isFetching}
          />
        )}
        {mediaQuery.isSuccess && items.length === 0 && (
          <EmptyState
            icon={ImageIcon}
            title={isFiltered ? 'Không có ảnh nào khớp bộ lọc.' : 'Thư mục trống'}
            description={
              isFiltered
                ? 'Thử từ khoá khác hoặc xoá bộ lọc.'
                : canUpload
                  ? 'Kéo thả ảnh vào đây hoặc bấm "Tải ảnh lên". JPEG, PNG, WebP, GIF, tối đa 10MB.'
                  : undefined
            }
            action={
              isFiltered ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Xoá bộ lọc
                </Button>
              ) : (
                uploadButton
              )
            }
          />
        )}
        {mediaQuery.isSuccess && items.length > 0 && (
          <div className="space-y-4">
            <MediaGrid items={items} showFolder={!folder} />
            <Pagination
              meta={mediaQuery.data.meta}
              onPageChange={(page) => updateParams({ page })}
            />
          </div>
        )}
      </DropZone>

      <ConfirmDialog
        isOpen={confirm === 'cleanup'}
        title="Dọn ảnh mồ côi?"
        description="Xoá vĩnh viễn các ảnh không còn nơi nào dùng và đã tải lên quá 24 giờ."
        confirmLabel="Dọn"
        isConfirming={cleanupMutation.isPending}
        onConfirm={handleCleanup}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        isOpen={confirm === 'delete-folder'}
        title={`Xoá thư mục "${folder}"?`}
        description="Chỉ xoá được thư mục trống — xoá hết ảnh trong thư mục trước."
        confirmLabel="Xoá thư mục"
        isConfirming={deleteFolderMutation.isPending}
        onConfirm={handleDeleteFolder}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/**
 * Xem ảnh của một thư mục (tải lên, lọc, xoá) hoặc mọi ảnh.
 * @param {Object} props
 * @param {string} [props.folder]
 */
export function MediaBrowser({ folder }) {
  return (
    <StorageGate title={folder ?? 'Tất cả ảnh'}>
      {/* key: đổi thư mục → hàng đợi tải lên và hộp thoại bắt đầu lại từ đầu. */}
      <BrowserContent key={folder ?? ''} folder={folder} />
    </StorageGate>
  );
}
