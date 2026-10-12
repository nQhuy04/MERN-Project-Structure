import { cn } from '@/shared/lib/cn';
import { getMediaUrl } from '@/shared/lib/media';

const SIZE_CLASSES = { sm: 'size-8 text-sm', md: 'size-10 text-base', lg: 'size-20 text-2xl' };

/**
 * Ảnh đại diện; chưa có ảnh → chữ cái đầu của tên.
 * @param {Object} props
 * @param {string} props.name
 * @param {string|null} [props.mediaId]
 * @param {'sm'|'md'|'lg'} [props.size='sm']
 * @param {boolean} [props.isDecorative=false] true khi tên đã hiển thị cạnh ảnh (alt rỗng)
 */
export function Avatar({ name, mediaId, size = 'sm', isDecorative = false }) {
  const className = cn('shrink-0 rounded-full object-cover', SIZE_CLASSES[size]);

  if (mediaId) {
    return (
      <img
        src={getMediaUrl(mediaId)}
        alt={isDecorative ? '' : `Ảnh đại diện của ${name}`}
        className={cn(className, 'bg-subtle ring-1 ring-line')}
      />
    );
  }

  return (
    <span
      aria-hidden={isDecorative || undefined}
      className={cn(
        className,
        'flex items-center justify-center bg-primary-soft font-semibold text-primary',
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
