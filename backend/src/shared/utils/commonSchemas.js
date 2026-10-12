import { z } from '../lib/zod.js';

/**
 * Zod schema dùng chung cho nhiều module (validate request ở biên API).
 */

/** ObjectId dạng chuỗi 24 ký tự hex — id sai định dạng bị chặn ở 400 thay vì thành CastError. */
export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, 'ID không hợp lệ');

/** Params dạng `/:id`. */
export const idParamsSchema = z.object({ id: objectIdSchema });
