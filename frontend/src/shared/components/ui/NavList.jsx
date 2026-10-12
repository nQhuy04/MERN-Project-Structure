import { NavLink } from 'react-router';
import { cn } from '@/shared/lib/cn';

/**
 * Danh sách link điều hướng có icon và trạng thái đang chọn — dùng cho sidebar quản trị và menu
 * trang tài khoản.
 * @param {Object} props
 * @param {string} [props.label] có → bọc `<nav aria-label>`; bỏ trống khi đã nằm trong một `<nav>`
 * @param {Array} props.items `[{ to, label, icon, end }]`
 * @param {'vertical'|'responsive'} [props.orientation='vertical'] `responsive` = tab cuộn ngang
 *   trên mobile, cột dọc từ `md`
 * @param {Function} [props.onNavigate] gọi khi bấm một mục (vd. đóng drawer mobile)
 * @param {string} [props.className]
 */
export function NavList({ label, items, orientation = 'vertical', onNavigate, className }) {
  const isResponsive = orientation === 'responsive';

  const list = (
    <ul
      className={cn(
        isResponsive
          ? 'flex gap-1 overflow-x-auto md:flex-col md:gap-0.5 md:overflow-visible'
          : 'space-y-0.5',
        !label && className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.to} className={isResponsive ? 'shrink-0' : undefined}>
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'text-fg-muted hover:bg-subtle hover:text-fg',
                )
              }
            >
              {Icon && <Icon className="size-4.5" />}
              {item.label}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );

  if (!label) return list;
  return (
    <nav aria-label={label} className={className}>
      {list}
    </nav>
  );
}
