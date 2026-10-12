import { useState } from 'react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/features/auth';
import { USER_STATUS_LABELS } from '@/features/users/constants';
import {
  useChangeUserRole,
  useLockUser,
  useUnlockUser,
} from '@/features/users/hooks/useAdminUsers';
import { getAllowedActions } from '@/features/users/permissions';
import { Avatar } from '@/shared/components/ui/Avatar';
import { Badge } from '@/shared/components/ui/Badge';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { DropdownMenu } from '@/shared/components/ui/DropdownMenu';
import { Table, TableCell, TableHeaderCell } from '@/shared/components/ui/Table';
import {
  LockIcon,
  MoreHorizontalIcon,
  UnlockIcon,
  UserCogIcon,
  UserIcon,
} from '@/shared/components/ui/icons';
import { ROLE_LABELS, USER_ROLES } from '@/shared/constants/roles';
import { formatDateTime } from '@/shared/lib/format';

const STATUS_TONES = { ACTIVE: 'success', LOCKED: 'danger', UNVERIFIED: 'warning' };

/**
 * Nội dung hộp thoại xác nhận theo loại thao tác.
 * @param {Object} action `{ type, user }`
 */
function describeAction({ type, user }) {
  const descriptions = {
    lock: {
      title: `Khoá tài khoản ${user.name}?`,
      description:
        'Người dùng bị đăng xuất khỏi mọi thiết bị và không đăng nhập được cho tới khi mở khoá.',
      confirmLabel: 'Khoá',
    },
    unlock: {
      title: `Mở khoá tài khoản ${user.name}?`,
      description: 'Người dùng đăng nhập lại được bình thường.',
      confirmLabel: 'Mở khoá',
    },
    promote: {
      title: `Nâng ${user.name} lên Quản trị viên?`,
      description: 'Người dùng vào được khu quản trị và khoá / mở khoá thành viên.',
      confirmLabel: 'Nâng quyền',
    },
    demote: {
      title: `Hạ ${user.name} về Thành viên?`,
      description: 'Người dùng mất quyền vào khu quản trị ngay lập tức.',
      confirmLabel: 'Hạ quyền',
    },
  };
  return descriptions[type];
}

/**
 * Các mục trong menu thao tác của một dòng (chỉ những thao tác người đang đăng nhập được phép).
 * @param {Object} currentUser
 * @param {Object} user dòng đang xét
 * @param {Function} request `(type) => void` mở hộp thoại xác nhận
 * @returns {Array}
 */
function buildRowActions(currentUser, user, request) {
  const { canLock, canChangeRole } = getAllowedActions(currentUser, user);
  const isLocked = user.status === 'LOCKED';
  const isAdmin = user.role === USER_ROLES.ADMIN;
  const actions = [];
  if (canChangeRole) {
    actions.push({
      label: isAdmin ? 'Hạ quyền' : 'Nâng quyền',
      icon: isAdmin ? UserIcon : UserCogIcon,
      onSelect: () => request(isAdmin ? 'demote' : 'promote'),
    });
  }
  if (canLock) {
    actions.push(
      isLocked
        ? { label: 'Mở khoá', icon: UnlockIcon, onSelect: () => request('unlock') }
        : { label: 'Khoá', icon: LockIcon, tone: 'danger', onSelect: () => request('lock') },
    );
  }
  return actions;
}

/**
 * Bảng người dùng + menu thao tác từng dòng (khoá / mở khoá / đổi vai trò, mỗi thao tác hỏi
 * xác nhận).
 * @param {Object} props
 * @param {Object[]} props.users
 */
export function UsersTable({ users }) {
  const currentUser = useCurrentUser();
  const lockMutation = useLockUser();
  const unlockMutation = useUnlockUser();
  const roleMutation = useChangeUserRole();
  const [pendingAction, setPendingAction] = useState(null);

  const isConfirming = lockMutation.isPending || unlockMutation.isPending || roleMutation.isPending;
  const callbacks = {
    onSuccess: (body) => toast.success(body.message),
    onError: (error) => toast.error(error.message),
    onSettled: () => setPendingAction(null),
  };

  const handleConfirm = () => {
    const { type, user } = pendingAction;
    if (type === 'lock') lockMutation.mutate(user.id, callbacks);
    if (type === 'unlock') unlockMutation.mutate(user.id, callbacks);
    if (type === 'promote')
      roleMutation.mutate({ userId: user.id, role: USER_ROLES.ADMIN }, callbacks);
    if (type === 'demote')
      roleMutation.mutate({ userId: user.id, role: USER_ROLES.MEMBER }, callbacks);
  };

  const dialog = pendingAction ? describeAction(pendingAction) : null;

  return (
    <>
      <Table
        caption="Danh sách người dùng"
        head={
          <>
            <TableHeaderCell>Người dùng</TableHeaderCell>
            <TableHeaderCell>Vai trò</TableHeaderCell>
            <TableHeaderCell>Trạng thái</TableHeaderCell>
            <TableHeaderCell>Đăng nhập gần nhất</TableHeaderCell>
            <TableHeaderCell className="w-12">
              <span className="sr-only">Thao tác</span>
            </TableHeaderCell>
          </>
        }
      >
        {users.map((user) => {
          const actions = buildRowActions(currentUser, user, (type) =>
            setPendingAction({ type, user }),
          );
          return (
            <tr key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} mediaId={user.avatarMediaId} isDecorative />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-fg-muted">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge tone={user.role === USER_ROLES.MEMBER ? 'neutral' : 'primary'}>
                  {ROLE_LABELS[user.role]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge tone={STATUS_TONES[user.status]} dot>
                  {USER_STATUS_LABELS[user.status]}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-fg-muted">
                {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Chưa đăng nhập'}
              </TableCell>
              <TableCell className="text-right">
                {actions.length > 0 && (
                  <DropdownMenu
                    label={`Thao tác với ${user.name}`}
                    trigger={<MoreHorizontalIcon />}
                    items={actions}
                  />
                )}
              </TableCell>
            </tr>
          );
        })}
      </Table>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={dialog?.title}
        description={dialog?.description}
        confirmLabel={dialog?.confirmLabel}
        variant={pendingAction?.type === 'lock' ? 'danger' : 'primary'}
        isConfirming={isConfirming}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}
