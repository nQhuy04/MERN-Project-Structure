import { useState } from 'react';
import { toast } from 'sonner';
import { useChangeAvatar, useRemoveAvatar } from '@/features/account/hooks/useAvatar';
import { useCurrentUser } from '@/features/auth';
import { usePublicSettings } from '@/features/settings';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { FileButton } from '@/shared/components/ui/FileButton';
import { UploadIcon } from '@/shared/components/ui/icons';

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

/** Đổi / gỡ ảnh đại diện (chỉ khi server đã cấu hình kho lưu trữ). */
export function AvatarUploader() {
  const currentUser = useCurrentUser();
  const { data: publicSettings } = usePublicSettings();
  const changeMutation = useChangeAvatar();
  const removeMutation = useRemoveAvatar();
  const [error, setError] = useState(null);

  if (!publicSettings?.features.storage) return null;

  const handleFiles = ([file]) => {
    if (!AVATAR_TYPES.includes(file.type))
      return setError('Chỉ chấp nhận ảnh JPEG, PNG, WebP, GIF');
    if (file.size > MAX_AVATAR_SIZE_BYTES) return setError('Ảnh đại diện tối đa 2MB');
    setError(null);

    changeMutation.mutate(file, {
      onSuccess: (body) => toast.success(body.message),
      onError: (uploadError) => toast.error(uploadError.message),
    });
  };

  const isBusy = changeMutation.isPending || removeMutation.isPending;

  return (
    <Card title="Ảnh đại diện">
      <div className="flex flex-wrap items-center gap-5">
        <Avatar name={currentUser.name} mediaId={currentUser.avatarMediaId} size="lg" />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <FileButton
              variant="secondary"
              icon={UploadIcon}
              accept={AVATAR_TYPES.join(',')}
              onFiles={handleFiles}
              disabled={isBusy}
              isLoading={changeMutation.isPending}
            >
              {changeMutation.isPending ? 'Đang tải ảnh...' : 'Đổi ảnh đại diện'}
            </FileButton>
            {currentUser.avatarMediaId && (
              <Button
                variant="ghost"
                disabled={isBusy}
                onClick={() =>
                  removeMutation.mutate(undefined, {
                    onSuccess: (body) => toast.success(body.message),
                    onError: (removeError) => toast.error(removeError.message),
                  })
                }
              >
                Gỡ ảnh
              </Button>
            )}
          </div>
          <p className="text-xs text-fg-muted">JPEG, PNG, WebP hoặc GIF, tối đa 2MB.</p>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
