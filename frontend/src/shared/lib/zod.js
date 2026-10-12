import { z } from 'zod';

// Cấu hình một lần: thông điệp lỗi mặc định bằng tiếng Việt (giống backend).
// Quy ước: mọi file import `z` từ đây, không import thẳng 'zod'.
z.config(z.locales.vi());

export { z };
