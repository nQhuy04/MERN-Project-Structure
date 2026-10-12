// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 09.
import { useState } from 'react';
import { toast } from 'sonner';
import { SETTING_KEYS } from '@/features/settings/constants';
import {
  useAdminSettings,
  useSendTestEmail,
  useUpdateSettings,
} from '@/features/settings/hooks/useSettings';
import { Button } from '@/shared/components/ui/Button';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { Select } from '@/shared/components/ui/Select';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Switch } from '@/shared/components/ui/Switch';
import { MailIcon } from '@/shared/components/ui/icons';
import { formatDateTime } from '@/shared/lib/format';
import { notImplemented } from '@/shared/lib/practice';

/**
 * Ô nhập của một setting theo `input` backend khai báo: 'boolean' → công tắc, 'select' → danh
 * sách lựa chọn (lựa chọn `disabled` = server chưa cấu hình, vẫn hiện để biết là có).
 * @param {Object} props
 * @param {Object} props.setting một mục trong GET /admin/settings
 * @param {string} props.inputId
 * @param {*} props.value giá trị đang hiển thị (bản nháp hoặc giá trị đã lưu)
 * @param {Function} props.onChange `(value) => void`
 */
function SettingControl({ setting, inputId, value, onChange }) {
  if (setting.input === 'select') {
    return (
      <Select
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        options={setting.options.map((option) => ({
          value: option.value,
          disabled: option.disabled,
          label: option.disabled ? `${option.label} (chưa cấu hình)` : option.label,
        }))}
        className="w-full sm:w-80"
      />
    );
  }
  return (
    <Switch
      id={inputId}
      checked={value}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-0.5"
    />
  );
}

/**
 * Gửi email thử qua kênh đang chọn trong form (kể cả khi chưa lưu) — để kiểm tra cấu hình
 * trước khi áp dụng cho mọi email của hệ thống.
 * @param {Object} props
 * @param {string} props.provider
 */
function SendTestEmailButton({ provider }) {
  const sendTestMutation = useSendTestEmail();

  /**
   * **[BÀI 15]** TODO(bai-15): `sendTestMutation.mutate(provider, { onSuccess, onError })` —
   * `onSuccess` hiện `toast.success(body.message)`, `onError` hiện `toast.error(error.message)`
   * (lý do từ server, vd. "Invalid login" khi sai App Password). Không có bản nháp nào cần xoá.
   */
  const handleClick = () => {
    notImplemented('bai-15');
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      icon={MailIcon}
      onClick={handleClick}
      isLoading={sendTestMutation.isPending}
    >
      Gửi email thử
    </Button>
  );
}

/**
 * Form cấu hình hệ thống, sinh từ danh sách setting do backend trả về (registry là nguồn sự
 * thật duy nhất — thêm setting ở backend là tự có ô ở đây). Hỗ trợ kiểu 'boolean', 'select'.
 * Thanh lưu dính đáy màn hình, báo số thay đổi chưa lưu.
 */
export function AdminSettingsForm() {
  const settingsQuery = useAdminSettings();
  const updateMutation = useUpdateSettings();
  const [draft, setDraft] = useState({});

  if (settingsQuery.isPending) {
    return (
      <div role="status" aria-label="Đang tải cấu hình..." className="max-w-3xl space-y-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }
  if (settingsQuery.isError) {
    return (
      <ErrorState
        title="Không tải được cấu hình"
        message={settingsQuery.error.message}
        onRetry={() => settingsQuery.refetch()}
        isRetrying={settingsQuery.isFetching}
      />
    );
  }

  const settings = settingsQuery.data;
  const changedKeys = Object.keys(draft).filter(
    (key) => draft[key] !== settings.find((setting) => setting.key === key)?.value,
  );

  /**
   * **[BÀI 09]** TODO(bai-09):
   * 1. `event.preventDefault()` — form HTML thường, không phải react-hook-form.
   * 2. Dựng `values` **chỉ gồm các key đã đổi**: `Object.fromEntries(changedKeys.map((key) =>
   *    [key, draft[key]]))`. Gửi cả những setting không đổi sẽ ghi đè `updatedBy` / `updatedAt`
   *    của chúng, làm sai lịch sử "ai sửa gì".
   * 3. `updateMutation.mutate(values, { onSuccess, onError })` — `onSuccess` hiện
   *    `toast.success(body.message)` và `setDraft({})` (xoá bản nháp, quay về trạng thái "chưa
   *    sửa gì"); `onError` hiện `toast.error(error.message)`.
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    notImplemented('bai-09');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
      <ul className="divide-y divide-line rounded-xl border border-line bg-surface shadow-xs">
        {settings.map((setting) => {
          const inputId = `setting-${setting.key}`;
          const value = draft[setting.key] ?? setting.value;
          const isChanged = changedKeys.includes(setting.key);
          return (
            <li
              key={setting.key}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="flex items-center gap-2">
                  <label htmlFor={inputId} className="font-medium">
                    {setting.label}
                  </label>
                  {isChanged && <span className="text-xs text-warning">• Chưa lưu</span>}
                </p>
                <p className="text-sm text-fg-muted">{setting.description}</p>
                {setting.updatedBy && (
                  <p className="text-xs text-fg-subtle">
                    Sửa lần cuối bởi {setting.updatedBy.name} lúc{' '}
                    {formatDateTime(setting.updatedAt)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                <SettingControl
                  setting={setting}
                  inputId={inputId}
                  value={value}
                  onChange={(nextValue) =>
                    setDraft((current) => ({ ...current, [setting.key]: nextValue }))
                  }
                />
                {setting.key === SETTING_KEYS.EMAIL_PROVIDER && (
                  <SendTestEmailButton provider={value} />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-line bg-surface/95 px-4 py-3 shadow-lg backdrop-blur">
        <p className="mr-auto text-sm text-fg-muted" aria-live="polite">
          {changedKeys.length > 0 ? `${changedKeys.length} thay đổi chưa lưu` : 'Không có thay đổi'}
        </p>
        {changedKeys.length > 0 && (
          <Button variant="ghost" onClick={() => setDraft({})} disabled={updateMutation.isPending}>
            Huỷ thay đổi
          </Button>
        )}
        <Button
          type="submit"
          disabled={changedKeys.length === 0}
          isLoading={updateMutation.isPending}
        >
          Lưu cấu hình
        </Button>
      </div>
    </form>
  );
}
