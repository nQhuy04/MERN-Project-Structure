import { useState } from 'react';
import { Link, generatePath } from 'react-router';
import { CreateFolderDialog } from '@/features/media/components/CreateFolderDialog';
import { StorageGate } from '@/features/media/components/StorageGate';
import { useMediaFolders } from '@/features/media/hooks/useMedia';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import {
  ChevronRightIcon,
  FolderIcon,
  FolderPlusIcon,
  GridIcon,
  UnlinkIcon,
} from '@/shared/components/ui/icons';
import { ROUTES } from '@/shared/constants/routes';
import { formatFileSize } from '@/shared/lib/format';
import { getMediaUrl } from '@/shared/lib/media';

/**
 * Ảnh bìa thẻ thư mục: lưới 2×2 các ảnh mới nhất, trống thì icon thư mục.
 * @param {Object} props
 * @param {string[]} props.coverIds
 */
function FolderCover({ coverIds }) {
  if (coverIds.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-subtle text-fg-subtle">
        <FolderIcon className="size-10" />
      </div>
    );
  }
  return (
    <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-0.5 bg-line">
      {coverIds.map((id, index) => (
        <img
          key={id}
          src={getMediaUrl(id)}
          alt=""
          loading="lazy"
          className={
            // 1 ảnh → phủ cả khung; 3 ảnh → ảnh đầu chiếm cột trái.
            coverIds.length === 1 || (coverIds.length === 3 && index === 0)
              ? 'col-span-2 row-span-2 size-full bg-subtle object-cover'
              : coverIds.length === 2
                ? 'row-span-2 size-full bg-subtle object-cover'
                : 'size-full bg-subtle object-cover'
          }
        />
      ))}
    </div>
  );
}

/**
 * Lối tắt xem ảnh không theo thư mục.
 * @param {Object} props `{ to, icon, title, description }`
 */
function QuickView({ to, icon: Icon, title, description }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs transition-colors hover:border-line-strong"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block truncate text-sm text-fg-muted">{description}</span>
      </span>
      <ChevronRightIcon className="text-fg-subtle transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function FolderOverview() {
  const foldersQuery = useMediaFolders();
  const [keyword, setKeyword] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const header = (
    <PageHeader
      title="Thư viện ảnh"
      description="Ảnh dùng trong hệ thống, sắp theo thư mục. Chọn một thư mục để xem và tải ảnh lên."
      actions={
        <Button icon={FolderPlusIcon} onClick={() => setIsCreateOpen(true)}>
          Thư mục mới
        </Button>
      }
    />
  );

  const folders = foldersQuery.data ?? [];
  const totalCount = folders.reduce((sum, folder) => sum + folder.mediaCount, 0);
  const visibleFolders = folders.filter((folder) => folder.name.includes(keyword.toLowerCase()));

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <QuickView
          to={ROUTES.ADMIN.MEDIA_ALL}
          icon={GridIcon}
          title="Tất cả ảnh"
          description={foldersQuery.isSuccess ? `${totalCount} ảnh ở mọi thư mục` : 'Mọi thư mục'}
        />
        <QuickView
          to={`${ROUTES.ADMIN.MEDIA_ALL}?usage=orphan`}
          icon={UnlinkIcon}
          title="Ảnh mồ côi"
          description="Ảnh không nơi nào dùng — dọn để tiết kiệm dung lượng"
        />
      </div>

      <section aria-labelledby="media-folders-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="media-folders-heading" className="font-semibold">
            Thư mục
            {foldersQuery.isSuccess && (
              <span className="ml-1.5 text-fg-muted">{folders.length}</span>
            )}
          </h2>
          <SearchInput
            label="Tìm thư mục"
            placeholder="Tìm thư mục..."
            value={keyword}
            onSearch={setKeyword}
            delay={0}
            className="w-full sm:w-64"
          />
        </div>

        {foldersQuery.isPending && (
          <div
            role="status"
            aria-label="Đang tải thư mục..."
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        )}
        {foldersQuery.isError && (
          <ErrorState
            title="Không tải được thư mục"
            message={foldersQuery.error.message}
            onRetry={() => foldersQuery.refetch()}
            isRetrying={foldersQuery.isFetching}
          />
        )}
        {foldersQuery.isSuccess && visibleFolders.length === 0 && (
          <EmptyState
            icon={FolderIcon}
            title={keyword ? 'Không có thư mục nào khớp.' : 'Chưa có thư mục nào.'}
            action={
              <Button
                variant="secondary"
                icon={FolderPlusIcon}
                onClick={() => setIsCreateOpen(true)}
              >
                Thư mục mới
              </Button>
            }
          />
        )}
        {visibleFolders.length > 0 && (
          <ul
            aria-label="Thư mục ảnh"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {visibleFolders.map((folder) => (
              <li key={folder.name}>
                <Link
                  to={generatePath(ROUTES.ADMIN.MEDIA_FOLDER, { folder: folder.name })}
                  className="group block overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-all hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md"
                >
                  <FolderCover coverIds={folder.coverIds} />
                  <div className="space-y-1 p-4">
                    <p className="flex items-center gap-2">
                      <FolderIcon className="text-fg-subtle" />
                      <span className="truncate font-medium">{folder.name}</span>
                      {folder.isSystem && <Badge>Hệ thống</Badge>}
                    </p>
                    <p className="text-sm text-fg-muted">
                      {folder.mediaCount > 0
                        ? `${folder.mediaCount} ảnh · ${formatFileSize(folder.totalSize)}`
                        : 'Thư mục trống'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CreateFolderDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}

/** Trang tổng quan thư viện ảnh: lối tắt + lưới thư mục + tạo thư mục. */
export function MediaLibrary() {
  return (
    <StorageGate title="Thư viện ảnh">
      <FolderOverview />
    </StorageGate>
  );
}
