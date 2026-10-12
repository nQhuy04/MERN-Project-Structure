import { z } from '../../shared/lib/zod.js';
import { SETTING_DEFINITIONS, SETTING_KEYS } from './settings.registry.js';

/**
 * Body cập nhật setting: `{ values: { key: value } }`. Schema dựng từ registry: mỗi key có kiểu
 * riêng, key lạ bị từ chối (strict) để bắt lỗi gõ sai tên.
 */
const valuesSchema = z
  .strictObject(
    Object.fromEntries(
      Object.entries(SETTING_DEFINITIONS).map(([key, definition]) => [
        key,
        definition.schema.optional(),
      ]),
    ),
  )
  .refine((values) => Object.keys(values).length > 0, 'Cần ít nhất một setting để cập nhật');

export const updateSettingsBodySchema = z.object({ values: valuesSchema });

/** Gửi email thử: kênh cần thử (cùng quy tắc với setting `email.provider` — phải đã cấu hình). */
export const sendTestEmailBodySchema = z.object({
  provider: SETTING_DEFINITIONS[SETTING_KEYS.EMAIL_PROVIDER].schema,
});
