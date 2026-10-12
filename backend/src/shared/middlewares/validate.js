import { z } from '../lib/zod.js';

const REQUEST_PARTS = ['params', 'query', 'body'];

/**
 * Validate request bằng Zod ở tầng route. Dữ liệu đã parse (ép kiểu, loại trường
 * thừa) được gắn vào `req.validated` — Express 5 không cho ghi đè `req.query`,
 * và controller chỉ nên đọc dữ liệu đã qua validate.
 *
 * Gom lỗi của cả params, query, body rồi ném một ZodError để errorHandler trả
 * VALIDATION_ERROR với đầy đủ `details`.
 *
 * @param {Object} schemas
 * @param {Object} [schemas.params] Zod schema cho route params
 * @param {Object} [schemas.query] Zod schema cho query string
 * @param {Object} [schemas.body] Zod schema cho body
 * @returns {Function} Express middleware
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const validated = {};
    const issues = [];

    for (const part of REQUEST_PARTS) {
      if (!schemas[part]) continue;

      // Không có body (thiếu Content-Type JSON) → coi như object rỗng để báo lỗi theo từng trường.
      const result = schemas[part].safeParse(req[part] ?? {});
      if (result.success) validated[part] = result.data;
      else issues.push(...result.error.issues);
    }

    if (issues.length > 0) throw new z.ZodError(issues);

    req.validated = validated;
    next();
  };
}
