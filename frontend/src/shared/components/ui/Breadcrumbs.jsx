import { Link } from 'react-router';
import { ChevronRightIcon } from '@/shared/components/ui/icons';

/**
 * Đường dẫn vị trí trang. Mục cuối là trang hiện tại (không phải link).
 * @param {Object} props
 * @param {Array} props.items `[{ label, to }]`
 */
export function Breadcrumbs({ items }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.to}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRightIcon className="size-3.5 text-fg-subtle" />}
              {isLast ? (
                <span aria-current="page" className="truncate font-medium text-fg">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="truncate text-fg-muted hover:text-fg">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
