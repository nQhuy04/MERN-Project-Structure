import { useState } from 'react';
import { toast } from 'sonner';
import { useDeleteFile, useDownloadFile } from '@/features/files/hooks/useFiles';
import { Button } from '@/shared/components/ui/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/shared/components/ui/DropdownMenu';
import {
  DownloadIcon,
  FileIcon,
  ImageIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from '@/shared/components/ui/icons';
import { formatDateTime, formatFileSize } from '@/shared/lib/format';

/**
 * @param {Object} props
 * @param {Object[]} props.files
 */
export function FileList({ files }) {
  const deleteMutation = useDeleteFile();
  const downloadMutation = useDownloadFile();
  const [fileToDelete, setFileToDelete] = useState(null);

  const handleDelete = () => {
    deleteMutation.mutate(fileToDelete.id, {
      onSuccess: (body) => toast.success(body.message),
      onError: (error) => toast.error(error.message),
      onSettled: () => setFileToDelete(null),
    });
  };

  return (
    <>
      <ul
        aria-label="File của tôi"
        className="divide-y divide-line rounded-xl border border-line bg-surface shadow-xs"
      >
        {files.map((file) => {
          const TypeIcon = file.contentType?.startsWith('image/') ? ImageIcon : FileIcon;
          return (
            <li key={file.id} className="flex items-center gap-4 px-4 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-fg-muted">
                <TypeIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium" title={file.originalName}>
                  {file.originalName}
                </p>
                <p className="text-fg-muted">
                  {formatFileSize(file.size)} · {formatDateTime(file.createdAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={DownloadIcon}
                disabled={downloadMutation.isPending}
                onClick={() =>
                  downloadMutation.mutate(file.id, {
                    onError: (error) => toast.error(error.message),
                  })
                }
              >
                Tải về
              </Button>
              <DropdownMenu
                label={`Thao tác với ${file.originalName}`}
                trigger={<MoreHorizontalIcon />}
                items={[
                  {
                    label: 'Xoá',
                    icon: TrashIcon,
                    tone: 'danger',
                    onSelect: () => setFileToDelete(file),
                  },
                ]}
              />
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        isOpen={fileToDelete !== null}
        title="Xoá file?"
        description={`"${fileToDelete?.originalName}" sẽ bị xoá vĩnh viễn.`}
        confirmLabel="Xoá"
        isConfirming={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setFileToDelete(null)}
      />
    </>
  );
}
