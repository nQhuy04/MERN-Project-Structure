import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '@/features/files/constants';
import { FileButton } from '@/shared/components/ui/FileButton';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import { FileIcon, UploadIcon } from '@/shared/components/ui/icons';
import { formatFileSize } from '@/shared/lib/format';

export const FILE_RULES_TEXT = `Ảnh (JPEG, PNG, WebP, GIF) hoặc PDF, tối đa ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`;

/**
 * Nút chọn file.
 * @param {Object} props
 * @param {Object} props.uploader kết quả `useFileUploader()` (hooks/useFileUploader.js)
 */
export function FileUploadButton({ uploader }) {
  return (
    <FileButton
      icon={UploadIcon}
      accept={ALLOWED_FILE_TYPES.join(',')}
      onFiles={uploader.upload}
      isLoading={uploader.isPending}
    >
      {uploader.isPending ? 'Đang tải lên...' : 'Tải file lên'}
    </FileButton>
  );
}

/**
 * Trạng thái tải lên: lỗi kiểm tra hoặc tiến trình file đang tải.
 * @param {Object} props
 * @param {Object} props.uploader kết quả `useFileUploader()`
 */
export function FileUploadStatus({ uploader }) {
  if (uploader.error) {
    return (
      <p role="alert" className="text-sm text-danger">
        {uploader.error}
      </p>
    );
  }
  if (!uploader.isPending) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <FileIcon className="size-5 text-fg-muted" />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="flex justify-between gap-3 text-sm">
          <span className="truncate font-medium">{uploader.fileName}</span>
          <span className="text-fg-muted tabular-nums">{uploader.progress}%</span>
        </p>
        <ProgressBar value={uploader.progress} label="Tiến trình tải lên" />
      </div>
    </div>
  );
}
