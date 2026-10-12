import { AlertTriangleIcon } from '@/shared/components/ui/icons';

/**
 * Lỗi chung của cả form (không gắn với ô nào), vd. lỗi mạng, bị giới hạn request.
 * @param {Object} props
 * @param {string} [props.message]
 */
export function FormError({ message }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger"
    >
      <AlertTriangleIcon className="mt-0.5" />
      <span>{message}</span>
    </p>
  );
}
