import { useState } from 'react';
import { toast } from 'sonner';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '@/features/files/constants';
import { useUploadFile } from '@/features/files/hooks/useFiles';
import { formatFileSize } from '@/shared/lib/format';

/**
 * Kiểm tra sớm ở trình duyệt (backend vẫn kiểm tra lại).
 * @param {File} file
 * @returns {string|null} thông điệp lỗi
 */
function validateFile(file) {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Chỉ chấp nhận ảnh (JPEG, PNG, WebP, GIF) hoặc PDF';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File tối đa ${formatFileSize(MAX_FILE_SIZE_BYTES)}`;
  }
  return null;
}

/**
 * Điều khiển tải file (dùng chung cho nút chọn file và vùng kéo thả): kiểm tra, tải thẳng lên
 * kho lưu trữ, theo dõi tiến trình. Tải lần lượt từng file.
 * @returns {Object} `{ upload(files), isPending, progress, fileName, error }`
 */
export function useFileUploader() {
  const uploadMutation = useUploadFile();
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);

  const upload = (files) => {
    if (files.length > 1) toast.info('Mỗi lần chỉ tải một file — đã lấy file đầu tiên');
    const [file] = files;
    const validationError = validateFile(file);
    setError(validationError);
    if (validationError) return;

    setFileName(file.name);
    uploadMutation.mutate(file, {
      onSuccess: () => toast.success(`Đã tải lên "${file.name}"`),
      onError: (uploadError) => toast.error(uploadError.message),
    });
  };

  return {
    upload,
    isPending: uploadMutation.isPending,
    progress: uploadMutation.progress,
    fileName,
    error,
  };
}
