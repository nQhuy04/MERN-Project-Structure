import { ApiStatusCard } from '@/features/health';
import { APP_NAME } from '@/shared/constants/app';

const HIGHLIGHTS = [
  'Đăng nhập mật khẩu, Google, magic link',
  'Phân quyền 3 cấp, khoá / mở khoá',
  'Kho ảnh & tệp trên Cloudflare R2',
  'Email giao dịch, lịch tự động',
];

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-6">
        <h1 className="text-4xl font-bold tracking-tight text-fg sm:text-5xl">{APP_NAME}</h1>
        <p className="max-w-2xl text-lg text-fg-muted">
          Source base fullstack JavaScript: auth, phân quyền, cấu hình hệ thống, storage, email,
          lịch tự động.
        </p>
        <ul className="flex flex-wrap gap-2">
          {HIGHLIGHTS.map((item) => (
            <li
              key={item}
              className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-fg-muted"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
      <ApiStatusCard />
    </div>
  );
}
