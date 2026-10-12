// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 12.
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeFile,
  deleteFile,
  filesKeys,
  getFileDownloadUrl,
  listFiles,
  presignFile,
} from '@/features/files/api/files.api';
import { uploadToPresignedUrl } from '@/shared/lib/directUpload';
import { notImplemented } from '@/shared/lib/practice';

/** @param {number} page */
export function useFiles(page) {
  return useQuery({
    queryKey: filesKeys.list(page),
    queryFn: () => listFiles(page),
    placeholderData: keepPreviousData,
  });
}

/**
 * **[BÀI 12]** Upload 3 bước: xin presigned URL → PUT **thẳng** lên R2 (có tiến trình) → báo
 * server kiểm tra.
 *
 * File **không đi qua backend**. Trình duyệt gửi thẳng lên R2 bằng URL đã ký, nên backend không
 * phải nhận và chuyển tiếp hàng chục MB — nó chỉ ký URL rồi xác nhận kết quả.
 *
 * ⚠️ `uploadToPresignedUrl` dùng một axios **riêng**, không phải http client chung: không được
 * gửi cookie hay access token của API sang một dịch vụ khác. Có test kiểm điều này (_"PUT thẳng
 * lên R2 (không kèm access token)"_).
 *
 * @returns {Object} kết quả useMutation + `progress` (0–100)
 */
export function useUploadFile() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  // TODO(bai-12): viết `mutationFn` theo đúng ba bước, và thêm `onSuccess` gọi
  // `queryClient.invalidateQueries({ queryKey: filesKeys.all })`.
  // 1. `setProgress(0)`, rồi `presignFile({ fileName: file.name, contentType: file.type,
  //    size: file.size })` → `{ file: pendingFile, upload }`.
  // 2. `uploadToPresignedUrl({ upload, file, onProgress: setProgress })` — PUT **thẳng** lên R2.
  // 3. `return completeFile(pendingFile.id)`.
  const mutation = useMutation({
    mutationFn: async () => notImplemented('bai-12'),
  });

  return { ...mutation, progress };
}

/** **[BÀI 12]** TODO(bai-12): thêm `onSuccess` làm mới danh sách (`filesKeys.all`). */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: deleteFile });
}

/**
 * **[BÀI 12]** Tải file: xin presigned GET rồi để **trình duyệt** tải (server đã đặt
 * `Content-Disposition: attachment` trong URL ký).
 *
 * TODO(bai-12): thêm `onSuccess: (url) => window.location.assign(url)`.
 *
 * Không `fetch` rồi tạo blob: file có thể rất lớn, và `window.location.assign` để trình duyệt lo
 * việc tải (có thanh tiến trình, tạm dừng, tiếp tục).
 */
export function useDownloadFile() {
  return useMutation({ mutationFn: getFileDownloadUrl });
}
