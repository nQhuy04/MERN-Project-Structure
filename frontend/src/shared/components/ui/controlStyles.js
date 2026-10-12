/**
 * Class dùng chung cho ô nhập / select / textarea — một nơi quyết định chiều cao, viền, focus,
 * trạng thái lỗi (`aria-invalid`) và bị khoá.
 */
export const CONTROL_CLASSES =
  'w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg shadow-xs transition-colors outline-none placeholder:text-fg-subtle hover:border-line-strong focus:border-primary focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-fg-muted aria-invalid:border-danger aria-invalid:focus:ring-danger/15';

/** Ô một dòng (input, select). */
export const SINGLE_LINE_CLASSES = 'h-9';
