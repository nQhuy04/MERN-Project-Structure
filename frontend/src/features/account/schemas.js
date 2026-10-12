import { z } from '@/shared/lib/zod';

const NAME_MAX_LENGTH = 100;

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên')
    .max(NAME_MAX_LENGTH, `Tên tối đa ${NAME_MAX_LENGTH} ký tự`),
});
