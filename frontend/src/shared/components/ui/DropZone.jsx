import { useRef, useState } from 'react';
import { UploadIcon } from '@/shared/components/ui/icons';
import { cn } from '@/shared/lib/cn';

/**
 * Vùng nhận file kéo thả, bọc quanh nội dung sẵn có (vd. lưới ảnh). Khi đang kéo file vào →
 * phủ lớp gợi ý. Luôn đi kèm một nút chọn file (kéo thả không dùng được bằng bàn phím).
 * @param {Object} props
 * @param {Function} props.onFiles nhận mảng File
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.hint='Thả file để tải lên']
 * @param {string} [props.className]
 */
export function DropZone({
  onFiles,
  disabled = false,
  hint = 'Thả file để tải lên',
  className,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave bắn cả khi đi qua phần tử con → đếm để biết thật sự rời vùng.
  const depthRef = useRef(0);

  const hasFiles = (event) => [...event.dataTransfer.types].includes('Files');

  return (
    <div
      className={cn('relative', className)}
      onDragEnter={(event) => {
        if (disabled || !hasFiles(event)) return;
        event.preventDefault();
        depthRef.current += 1;
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        if (disabled || !hasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={() => {
        if (disabled) return;
        depthRef.current = Math.max(0, depthRef.current - 1);
        if (depthRef.current === 0) setIsDragging(false);
      }}
      onDrop={(event) => {
        if (disabled || !hasFiles(event)) return;
        event.preventDefault();
        depthRef.current = 0;
        setIsDragging(false);
        const files = [...event.dataTransfer.files];
        if (files.length > 0) onFiles(files);
      }}
    >
      {children}
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary-soft/85 text-primary">
          <UploadIcon className="size-6" />
          <p className="font-medium">{hint}</p>
        </div>
      )}
    </div>
  );
}
