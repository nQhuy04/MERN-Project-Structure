// check-conventions: allow-unused-imports — `mediaKeys` bên dưới là gợi ý cho bài 13.
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cleanupOrphanMedia,
  completeMedia,
  createMediaFolder,
  deleteMedia,
  deleteMediaFolder,
  listMedia,
  listMediaFolders,
  mediaKeys,
  presignMedia,
} from '@/features/media/api/media.api';
import { MAX_MEDIA_SIZE_BYTES, MEDIA_IMAGE_TYPES } from '@/features/media/constants';
import { uploadToPresignedUrl } from '@/shared/lib/directUpload';

/** Ảnh tải xong còn hiện trong hàng đợi bao lâu (ảnh lỗi giữ tới khi người dùng ẩn). */
const DONE_VISIBLE_MS = 3000;

/** @param {Object} params bộ lọc + `folder` (bỏ trống = mọi thư mục) */
export function useMediaList(params) {
  return useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: () => listMedia(params),
    placeholderData: keepPreviousData,
  });
}

export function useMediaFolders() {
  return useQuery({ queryKey: mediaKeys.folders(), queryFn: listMediaFolders });
}

/** Mọi thay đổi thư viện: xong thì làm mới danh sách ảnh + thư mục. */
function useMediaMutation(mutationFn) {
  const queryClient = useQueryClient();
  // TODO(bai-13): thêm `onSuccess` gọi
  // `queryClient.invalidateQueries({ queryKey: mediaKeys.all })` — dùng tiền tố chung, vì xoá
  // hoặc dọn ảnh làm mọi danh sách đang cache (mọi bộ lọc) đều có thể sai.
  return useMutation({ mutationFn });
}

export const useCreateMediaFolder = () => useMediaMutation(createMediaFolder);
export const useDeleteMediaFolder = () => useMediaMutation(deleteMediaFolder);
export const useDeleteMedia = () => useMediaMutation(deleteMedia);
export const useCleanupOrphanMedia = () => useMediaMutation(cleanupOrphanMedia);

/**
 * Kiểm tra sớm ở trình duyệt (backend vẫn kiểm tra lại).
 * @param {File} file
 * @returns {string|null} thông điệp lỗi
 */
function validateImage(file) {
  if (!MEDIA_IMAGE_TYPES[file.type]) return 'Chỉ chấp nhận ảnh JPEG, PNG, WebP, GIF';
  if (file.size > MAX_MEDIA_SIZE_BYTES) return 'Ảnh tối đa 10MB';
  return null;
}

/**
 * Hàng đợi tải nhiều ảnh vào một thư mục: mỗi ảnh presign → PUT thẳng R2 (có tiến trình) → xác
 * nhận, lần lượt từng ảnh. Ảnh sai loại / quá cỡ hiện lỗi ngay, không gọi API.
 * @param {string} folder
 * @returns {Object} `{ items, enqueue(files), dismiss(id), isUploading }` — item:
 *   `{ id, name, progress, status: 'queued'|'uploading'|'done'|'error', error }`
 */
export function useMediaUploadQueue(folder) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]);

  const update = (id, changes) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  const uploadOne = async ({ id, file }) => {
    update(id, { status: 'uploading' });
    try {
      const { media, upload } = await presignMedia({
        folder,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
      });
      await uploadToPresignedUrl({
        upload,
        file,
        onProgress: (progress) => update(id, { progress }),
      });
      await completeMedia(media.id);
      update(id, { status: 'done', progress: 100 });
      return true;
    } catch (error) {
      update(id, { status: 'error', error: error.message });
      return false;
    }
  };

  /**
   * @param {File[]} files
   * @returns {Promise} resolve số ảnh tải lên thành công
   */
  const enqueue = async (files) => {
    const newItems = files.map((file) => {
      const error = validateImage(file);
      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        progress: 0,
        status: error ? 'error' : 'queued',
        error,
      };
    });
    // Ảnh đã xong của lượt trước không cần hiện nữa.
    setItems((current) => [...current.filter((item) => item.status !== 'done'), ...newItems]);

    let uploadedCount = 0;
    for (const item of newItems.filter((newItem) => newItem.status === 'queued')) {
      if (await uploadOne(item)) uploadedCount += 1;
    }
    if (uploadedCount > 0) {
      await queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      setTimeout(
        () => setItems((current) => current.filter((item) => item.status !== 'done')),
        DONE_VISIBLE_MS,
      );
    }
    return uploadedCount;
  };

  const dismiss = (id) => setItems((current) => current.filter((item) => item.id !== id));

  return {
    items,
    enqueue,
    dismiss,
    isUploading: items.some((item) => item.status === 'queued' || item.status === 'uploading'),
  };
}
