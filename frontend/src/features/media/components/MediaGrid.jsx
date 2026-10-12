import { useState } from 'react';
import { Link, generatePath } from 'react-router';
import { toast } from 'sonner';
import { useDeleteMedia } from '@/features/media/hooks/useMedia';
import { Badge } from '@/shared/components/ui/Badge';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Dialog } from '@/shared/components/ui/Dialog';
import { DropdownMenu } from '@/shared/components/ui/DropdownMenu';
import {
  ArrowUpRightIcon,
  CopyIcon,
  FolderIcon,
  LinkIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from '@/shared/components/ui/icons';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { ROUTES } from '@/shared/constants/routes';
import { formatFileSize } from '@/shared/lib/format';
import { getMediaUrl } from '@/shared/lib/media';

/**
 * Danh sách nơi dùng (link tới nơi đó để xử lý).
 * @param {Object} props
 * @param {Array} props.usages `[{ label, href }]`
 */
function UsageList({ usages }) {
  return (
    <ul className="space-y-1.5">
      {usages.map((usage) => (
        <li key={usage.href}>
          <Link
            to={usage.href}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <LinkIcon className="size-3.5" />
            {usage.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Lưới ảnh: ảnh, tên, dung lượng, trạng thái dùng; thao tác trong menu ⋯ (mở ảnh, sao chép
 * liên kết, xem nơi dùng, xoá có xác nhận). Xoá ảnh đang dùng → server từ chối kèm nơi dùng.
 * @param {Object} props
 * @param {Object[]} props.items
 * @param {boolean} [props.showFolder=false] hiện tên thư mục (trang "Tất cả ảnh")
 */
export function MediaGrid({ items, showFolder = false }) {
  const deleteMutation = useDeleteMedia();
  const [mediaToDelete, setMediaToDelete] = useState(null);
  // { title, usages } — hộp thoại liệt kê nơi dùng (xem chủ động hoặc do xoá bị chặn)
  const [usageDialog, setUsageDialog] = useState(null);

  const handleDelete = () => {
    deleteMutation.mutate(mediaToDelete.id, {
      onSuccess: (body) => toast.success(body.message),
      onError: (error) => {
        if (error.code === ERROR_CODES.MEDIA_IN_USE) {
          setUsageDialog({
            title: 'Ảnh đang được sử dụng',
            usages: error.details,
            isBlocked: true,
          });
        } else {
          toast.error(error.message);
        }
      },
      onSettled: () => setMediaToDelete(null),
    });
  };

  const copyLink = async (item) => {
    try {
      await navigator.clipboard.writeText(getMediaUrl(item.id));
      toast.success('Đã sao chép liên kết ảnh');
    } catch {
      toast.error('Trình duyệt không cho sao chép — mở ảnh rồi sao chép địa chỉ');
    }
  };

  return (
    <>
      <ul
        aria-label="Danh sách ảnh"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {items.map((item) => {
          const isInUse = item.usages.length > 0;
          return (
            <li
              key={item.id}
              className="group rounded-xl border border-line bg-surface shadow-xs transition-shadow hover:shadow-md"
            >
              <a
                href={getMediaUrl(item.id)}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-t-xl"
              >
                <img
                  src={getMediaUrl(item.id)}
                  alt={item.name}
                  loading="lazy"
                  className="aspect-square w-full bg-subtle object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </a>
              <div className="flex items-start gap-1 p-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium" title={item.name}>
                    {item.name}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-fg-muted">
                    {showFolder && (
                      <Link
                        to={generatePath(ROUTES.ADMIN.MEDIA_FOLDER, { folder: item.folder })}
                        className="inline-flex items-center gap-1 hover:text-fg"
                      >
                        <FolderIcon className="size-3" />
                        {item.folder}
                        <span aria-hidden="true">·</span>
                      </Link>
                    )}
                    {formatFileSize(item.size)}
                  </p>
                  {isInUse ? (
                    <Badge tone="success" dot>
                      Đang dùng · {item.usages.length}
                    </Badge>
                  ) : (
                    <Badge tone="warning" dot>
                      Mồ côi
                    </Badge>
                  )}
                </div>
                <DropdownMenu
                  label={`Thao tác với ${item.name}`}
                  trigger={<MoreHorizontalIcon />}
                  items={[
                    { label: 'Mở ảnh', icon: ArrowUpRightIcon, href: getMediaUrl(item.id) },
                    { label: 'Sao chép liên kết', icon: CopyIcon, onSelect: () => copyLink(item) },
                    ...(isInUse
                      ? [
                          {
                            label: 'Xem nơi dùng',
                            icon: LinkIcon,
                            onSelect: () =>
                              setUsageDialog({
                                title: `Nơi dùng "${item.name}"`,
                                usages: item.usages,
                              }),
                          },
                        ]
                      : []),
                    { type: 'separator' },
                    {
                      label: 'Xoá',
                      icon: TrashIcon,
                      tone: 'danger',
                      onSelect: () => setMediaToDelete(item),
                    },
                  ]}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        isOpen={mediaToDelete !== null}
        title="Xoá ảnh?"
        description={`"${mediaToDelete?.name}" sẽ bị xoá vĩnh viễn khỏi kho lưu trữ.`}
        confirmLabel="Xoá"
        isConfirming={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setMediaToDelete(null)}
      />

      <Dialog
        isOpen={usageDialog !== null}
        onClose={() => setUsageDialog(null)}
        role={usageDialog?.isBlocked ? 'alertdialog' : 'dialog'}
        title={usageDialog?.title ?? ''}
        description={usageDialog?.isBlocked ? 'Gỡ ảnh khỏi các nơi sau trước khi xoá:' : undefined}
      >
        {usageDialog && <UsageList usages={usageDialog.usages} />}
      </Dialog>
    </>
  );
}
