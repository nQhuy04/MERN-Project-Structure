import { z } from 'zod';

// Cấu hình một lần cho toàn backend: thông điệp lỗi mặc định bằng tiếng Việt.
// Quy ước: mọi file khác import `z` từ đây, không import thẳng 'zod', để không file
// nào vô tình dùng Zod khi chưa được cấu hình.
z.config(z.locales.vi());

export { z };
