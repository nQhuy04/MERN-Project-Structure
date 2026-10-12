/**
 * Ghép class Tailwind, bỏ giá trị falsy: `cn('px-2', isActive && 'font-bold')`.
 * @param {...(string|false|null|undefined)} classNames
 * @returns {string}
 */
export function cn(...classNames) {
  return classNames.filter(Boolean).join(' ');
}
