import { useState } from 'react';
import { generatePath, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { MEDIA_FOLDER_MAX_LENGTH, MEDIA_FOLDER_PATTERN } from '@/features/media/constants';
import { useCreateMediaFolder } from '@/features/media/hooks/useMedia';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { TextField } from '@/shared/components/ui/TextField';
import { ERROR_CODES } from '@/shared/constants/errorCodes';
import { ROUTES } from '@/shared/constants/routes';
import { toSlug, trimSlug } from '@/shared/lib/slug';

const FORM_ID = 'create-media-folder';

/**
 * Tạo thư mục rỗng. Gõ tự do ("Sự kiện 2026") → tự chuyển thành tên hợp lệ ("su-kien-2026").
 * Tạo xong → mở luôn thư mục để tải ảnh vào.
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 */
export function CreateFolderDialog({ isOpen, onClose }) {
  const navigate = useNavigate();
  const createMutation = useCreateMediaFolder();
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  const close = () => {
    setName('');
    setError(null);
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const folder = trimSlug(name);
    if (!MEDIA_FOLDER_PATTERN.test(folder)) {
      setError('Nhập tên thư mục (chữ thường, số, dấu gạch ngang)');
      return;
    }
    createMutation.mutate(folder, {
      onSuccess: (body) => {
        toast.success(body.message);
        close();
        navigate(generatePath(ROUTES.ADMIN.MEDIA_FOLDER, { folder }));
      },
      onError: (apiError) => {
        if (apiError.code === ERROR_CODES.FOLDER_EXISTS) setError(apiError.message);
        else toast.error(apiError.message);
      },
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={close}
      title="Thư mục mới"
      description="Tạo thư mục trống, sau đó tải ảnh vào."
      size="sm"
      isDismissable={!createMutation.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={createMutation.isPending}>
            Huỷ
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={createMutation.isPending}>
            Tạo thư mục
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Tên thư mục"
          value={name}
          maxLength={MEDIA_FOLDER_MAX_LENGTH}
          placeholder="vd. banners, su-kien-2026"
          autoComplete="off"
          onChange={(event) => {
            setName(toSlug(event.target.value));
            setError(null);
          }}
          error={error}
          hint="Chữ thường, số, dấu gạch ngang — gõ có dấu hoặc khoảng trắng sẽ tự chuyển."
        />
      </form>
    </Dialog>
  );
}
