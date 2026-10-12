// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 07.
import { useState } from 'react';
import { toast } from 'sonner';
import { notImplemented } from '@/shared/lib/practice';
import {
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from '@/features/account/hooks/useSessions';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { LogOutIcon, MonitorIcon } from '@/shared/components/ui/icons';
import { formatDateTime } from '@/shared/lib/format';

const DEVICE_LABELS = { desktop: 'Máy tính', mobile: 'Điện thoại', tablet: 'Máy tính bảng' };

/** Danh sách thiết bị đang đăng nhập, thu hồi từng phiên hoặc mọi phiên khác. */
export function SessionList() {
  const sessionsQuery = useSessions();
  const revokeMutation = useRevokeSession();
  const revokeOthersMutation = useRevokeOtherSessions();
  // null = đóng hộp thoại; { type: 'one', session } | { type: 'others' }
  const [pendingAction, setPendingAction] = useState(null);

  if (sessionsQuery.isPending) {
    return (
      <div role="status" aria-label="Đang tải danh sách phiên..." className="space-y-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <ErrorState
        title="Không tải được danh sách phiên"
        message={sessionsQuery.error.message}
        onRetry={() => sessionsQuery.refetch()}
        isRetrying={sessionsQuery.isFetching}
      />
    );
  }

  const sessions = sessionsQuery.data;
  const hasOtherSessions = sessions.some((session) => !session.isCurrent);
  const isConfirming = revokeMutation.isPending || revokeOthersMutation.isPending;

  const closeDialog = () => setPendingAction(null);
  const mutationCallbacks = {
    onSuccess: (body) => {
      toast.success(body.message);
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message);
      closeDialog();
    },
  };

  /**
   * **[BÀI 07]** TODO(bai-07): người dùng bấm "Xác nhận" trong hộp thoại.
   * - `pendingAction.type === 'one'` → `revokeMutation.mutate(pendingAction.session.id,
   *   mutationCallbacks)`.
   * - Ngược lại → `revokeOthersMutation.mutate(undefined, mutationCallbacks)` (mutation không
   *   nhận tham số, nhưng vẫn phải truyền `undefined` để đưa callbacks vào đúng vị trí thứ hai).
   *
   * `mutationCallbacks` (ngay phía trên) đã lo toast + đóng hộp thoại cho cả hai nhánh.
   */
  const handleConfirm = () => {
    notImplemented('bai-07');
  };

  return (
    <>
      <Card
        title="Thiết bị đang đăng nhập"
        description={hasOtherSessions ? undefined : 'Bạn chỉ đang đăng nhập trên thiết bị này.'}
        actions={
          hasOtherSessions && (
            <Button
              variant="danger-ghost"
              size="sm"
              icon={LogOutIcon}
              onClick={() => setPendingAction({ type: 'others' })}
            >
              Đăng xuất mọi thiết bị khác
            </Button>
          )
        }
        bodyClassName="p-0"
      >
        <ul aria-label="Thiết bị đang đăng nhập" className="divide-y divide-line">
          {sessions.map((session) => (
            <li key={session.id} className="flex items-center gap-4 px-5 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-subtle text-fg-muted">
                <MonitorIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5 text-sm">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {session.device.browser} trên {session.device.os}
                  {session.isCurrent && (
                    <Badge tone="success" dot>
                      Phiên hiện tại
                    </Badge>
                  )}
                </p>
                <p className="text-fg-muted">
                  {DEVICE_LABELS[session.device.deviceType]}
                  {session.ip && ` · IP ${session.ip}`} · Hoạt động lúc{' '}
                  {formatDateTime(session.lastUsedAt)}
                </p>
              </div>
              {!session.isCurrent && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPendingAction({ type: 'one', session })}
                >
                  Thu hồi
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={
          pendingAction?.type === 'one'
            ? 'Thu hồi phiên đăng nhập?'
            : 'Đăng xuất mọi thiết bị khác?'
        }
        description={
          pendingAction?.type === 'one'
            ? `Thiết bị "${pendingAction.session.device.browser} trên ${pendingAction.session.device.os}" sẽ bị đăng xuất ngay.`
            : 'Mọi thiết bị khác sẽ bị đăng xuất ngay. Thiết bị này vẫn giữ đăng nhập.'
        }
        confirmLabel={pendingAction?.type === 'one' ? 'Thu hồi' : 'Đăng xuất tất cả'}
        isConfirming={isConfirming}
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
    </>
  );
}
