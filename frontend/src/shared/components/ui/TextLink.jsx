import { Link } from 'react-router';
import { cn } from '@/shared/lib/cn';

/**
 * Link chữ trong đoạn văn (Quên mật khẩu?, Đăng ký...).
 * @param {Object} props props của `<Link>`
 */
export function TextLink({ className, ...props }) {
  return (
    <Link
      className={cn(
        'font-medium text-primary underline-offset-4 hover:text-primary-hover hover:underline',
        className,
      )}
      {...props}
    />
  );
}
