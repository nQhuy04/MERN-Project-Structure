import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router';
import { buttonClassName } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/cn';

const MENU_GAP_PX = 6;
const VIEWPORT_MARGIN_PX = 8;

const ITEM_CLASSES =
  'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm outline-none transition-colors focus-visible:outline-none';

/**
 * Menu thả xuống (hành động phụ của một dòng/thẻ, menu tài khoản...).
 * - Bàn phím: mở → focus mục đầu; ↑/↓/Home/End di chuyển; Escape đóng và trả focus về nút mở.
 * - Vị trí `fixed` theo nút mở → không bị cắt bởi bảng cuộn ngang / thẻ `overflow-hidden`;
 *   thiếu chỗ bên dưới thì lật lên trên.
 * @param {Object} props
 * @param {string} props.label tên nút mở cho trình đọc màn hình (bắt buộc khi nút chỉ có icon)
 * @param {*} props.trigger nội dung nút mở (icon, avatar + tên...)
 * @param {string} [props.triggerClassName] mặc định là nút icon `ghost`
 * @param {Array} props.items `[{ label, icon, onSelect, to, href, tone: 'danger', disabled }]`
 *   (`to` = link nội bộ, `href` = mở tab mới) hoặc `{ type: 'separator' }`
 * @param {*} [props.header] phần đầu không tương tác (vd. tên + email người dùng)
 * @param {'start'|'end'} [props.align='end'] căn menu theo mép trái / phải nút mở
 */
export function DropdownMenu({ label, trigger, triggerClassName, items, header, align = 'end' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const location = useLocation();

  const close = ({ restoreFocus = false } = {}) => {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  // Chuyển trang → đóng menu.
  useEffect(() => setIsOpen(false), [location.pathname]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const opensUp =
      rect.bottom + MENU_GAP_PX + menuHeight > window.innerHeight - VIEWPORT_MARGIN_PX &&
      rect.top - MENU_GAP_PX - menuHeight > VIEWPORT_MARGIN_PX;
    setPosition({
      top: opensUp ? rect.top - MENU_GAP_PX - menuHeight : rect.bottom + MENU_GAP_PX,
      ...(align === 'end'
        ? { right: Math.max(VIEWPORT_MARGIN_PX, window.innerWidth - rect.right) }
        : { left: Math.max(VIEWPORT_MARGIN_PX, rect.left) }),
    });
  }, [isOpen, align]);

  // Focus mục đầu sau khi menu đã có vị trí (phần tử còn `visibility: hidden` thì không nhận focus).
  useEffect(() => {
    if (isOpen && position) {
      menuRef.current?.querySelector('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
    }
  }, [isOpen, position]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) {
        close();
      }
    };
    const handleScrollOrResize = (event) => {
      if (!menuRef.current?.contains(event.target)) close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const handleMenuKeyDown = (event) => {
    const menuItems = [
      ...menuRef.current.querySelectorAll('[role="menuitem"]:not([aria-disabled="true"])'),
    ];
    const index = menuItems.indexOf(document.activeElement);
    const moves = {
      ArrowDown: (index + 1) % menuItems.length,
      ArrowUp: (index - 1 + menuItems.length) % menuItems.length,
      Home: 0,
      End: menuItems.length - 1,
    };
    if (event.key in moves) {
      event.preventDefault();
      menuItems[moves[event.key]]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close({ restoreFocus: true });
    } else if (event.key === 'Tab') {
      close();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !isOpen) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        className={triggerClassName ?? buttonClassName({ variant: 'ghost', size: 'icon-sm' })}
      >
        {trigger}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            onKeyDown={handleMenuKeyDown}
            style={{ position: 'fixed', ...position, visibility: position ? 'visible' : 'hidden' }}
            className="z-40 max-w-[calc(100vw-1rem)] min-w-52 rounded-xl border border-line bg-surface p-1 shadow-xl"
          >
            {header && (
              <div className="mb-1 border-b border-line px-2.5 pt-1.5 pb-2.5">{header}</div>
            )}
            {items.map((item, index) => {
              if (item.type === 'separator') {
                return (
                  <div key={`separator-${index}`} role="separator" className="my-1 h-px bg-line" />
                );
              }
              const Icon = item.icon;
              const className = cn(
                ITEM_CLASSES,
                item.tone === 'danger'
                  ? 'text-danger hover:bg-danger-soft focus-visible:bg-danger-soft'
                  : 'text-fg hover:bg-subtle focus-visible:bg-subtle',
                item.disabled && 'pointer-events-none opacity-55',
              );
              const content = (
                <>
                  {Icon && (
                    <Icon className={item.tone === 'danger' ? 'text-danger' : 'text-fg-muted'} />
                  )}
                  <span className="truncate">{item.label}</span>
                </>
              );
              if (item.href) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => close()}
                    className={className}
                  >
                    {content}
                  </a>
                );
              }
              return item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => close()}
                  className={className}
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  aria-disabled={item.disabled || undefined}
                  onClick={() => {
                    if (item.disabled) return;
                    close({ restoreFocus: true });
                    item.onSelect();
                  }}
                  className={className}
                >
                  {content}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
