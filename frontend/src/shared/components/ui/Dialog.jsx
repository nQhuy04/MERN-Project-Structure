import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '@/shared/components/ui/icons';
import { cn } from '@/shared/lib/cn';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const SIZE_CLASSES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

/**
 * Hộp thoại modal: khoá focus bên trong (Tab vòng lại), Escape / bấm nền để đóng, trả focus về
 * phần tử đã mở nó, khoá cuộn trang. Render qua portal vào `<body>`.
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {*} [props.description]
 * @param {*} [props.footer] các nút cuối hộp thoại
 * @param {'dialog'|'alertdialog'} [props.role='dialog'] `alertdialog` cho xác nhận thao tác nguy hiểm
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {Object} [props.initialFocusRef] ref phần tử nhận focus khi mở (mặc định phần tử đầu tiên)
 * @param {boolean} [props.isDismissable=true] false khi đang xử lý (không cho đóng giữa chừng)
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  footer,
  role = 'dialog',
  size = 'md',
  initialFocusRef,
  isDismissable = true,
  children,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const isDismissableRef = useRef(isDismissable);

  useEffect(() => {
    onCloseRef.current = onClose;
    isDismissableRef.current = isDismissable;
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const previouslyFocused = document.activeElement;
    const focusables = () => [...(panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [])];
    (initialFocusRef?.current ?? focusables()[0] ?? panelRef.current)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isDismissableRef.current) {
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key === 'Tab') {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, initialFocusRef]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-overlay backdrop-blur-[2px]"
        onClick={isDismissable ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-xl border border-line bg-surface shadow-2xl outline-none',
          SIZE_CLASSES[size],
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5">
          <h2 id={titleId} className="text-lg font-semibold text-fg">
            {title}
          </h2>
          {isDismissable && (
            <button
              type="button"
              aria-label="Đóng"
              onClick={onClose}
              className="-mt-1 -mr-2 flex size-8 items-center justify-center rounded-md text-fg-subtle hover:bg-subtle hover:text-fg"
            >
              <XIcon />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pt-2 pb-5">
          {description && (
            <div id={descriptionId} className="text-sm text-fg-muted">
              {description}
            </div>
          )}
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2 rounded-b-xl border-t border-line bg-canvas px-6 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
