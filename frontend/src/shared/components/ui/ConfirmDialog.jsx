import { useRef } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';

/**
 * Hộp thoại xác nhận trước thao tác không hoàn tác được (thu hồi phiên, xoá, khoá...).
 * Mở → focus vào nút huỷ (an toàn hơn nút xác nhận); Escape hoặc bấm nền → đóng.
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {string} props.title
 * @param {*} props.description nội dung giải thích hậu quả
 * @param {string} [props.confirmLabel='Xác nhận']
 * @param {'primary'|'danger'} [props.variant='danger']
 * @param {boolean} [props.isConfirming=false] đang xử lý → khoá nút
 * @param {Function} props.onConfirm
 * @param {Function} props.onCancel
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Xác nhận',
  variant = 'danger',
  isConfirming = false,
  onConfirm,
  onCancel,
}) {
  const cancelButtonRef = useRef(null);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCancel}
      role="alertdialog"
      title={title}
      description={description}
      initialFocusRef={cancelButtonRef}
      isDismissable={!isConfirming}
      footer={
        <>
          <Button
            ref={cancelButtonRef}
            variant="secondary"
            onClick={onCancel}
            disabled={isConfirming}
          >
            Huỷ
          </Button>
          <Button variant={variant} onClick={onConfirm} isLoading={isConfirming}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
