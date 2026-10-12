import { useId, useState } from 'react';
import { GoogleLoginButton } from '@/features/auth/components/GoogleLoginButton';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { MagicLinkForm } from '@/features/auth/components/MagicLinkForm';
import { SETTING_KEYS, usePublicSetting } from '@/features/settings';
import { TextLink } from '@/shared/components/ui/TextLink';
import { ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/lib/cn';

const METHODS = [
  { id: 'password', label: 'Mật khẩu' },
  { id: 'magic-link', label: 'Liên kết email' },
];

/**
 * Các cách đăng nhập. Tab "Liên kết email" chỉ hiện khi Super Admin bật magic link; link đăng ký
 * chỉ hiện khi đăng ký đang mở.
 */
export function LoginMethods() {
  const isMagicLinkEnabled = usePublicSetting(SETTING_KEYS.MAGIC_LINK_ENABLED) === true;
  const isRegistrationEnabled = usePublicSetting(SETTING_KEYS.REGISTRATION_ENABLED) === true;
  const [activeMethod, setActiveMethod] = useState('password');
  const idPrefix = useId();
  const method = isMagicLinkEnabled ? activeMethod : 'password';

  return (
    <div className="space-y-6">
      <GoogleLoginButton />
      {isMagicLinkEnabled && (
        <div role="tablist" aria-label="Cách đăng nhập" className="flex rounded-lg bg-subtle p-1">
          {METHODS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${idPrefix}-${item.id}-tab`}
              aria-selected={method === item.id}
              aria-controls={`${idPrefix}-${item.id}-panel`}
              onClick={() => setActiveMethod(item.id)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                method === item.id ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div
        role={isMagicLinkEnabled ? 'tabpanel' : undefined}
        id={`${idPrefix}-${method}-panel`}
        aria-labelledby={isMagicLinkEnabled ? `${idPrefix}-${method}-tab` : undefined}
      >
        {method === 'password' ? <LoginForm /> : <MagicLinkForm />}
      </div>
      {isRegistrationEnabled && (
        <p className="text-center text-sm text-fg-muted">
          Chưa có tài khoản? <TextLink to={ROUTES.AUTH.REGISTER}>Đăng ký</TextLink>
        </p>
      )}
    </div>
  );
}
