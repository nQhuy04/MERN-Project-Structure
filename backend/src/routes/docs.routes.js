import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const OPENAPI_FILE = fileURLToPath(new URL('../../../docs/openapi.yaml', import.meta.url));
const OPENAPI_URL = '/api/docs/openapi.yaml';

/**
 * Swagger UI cho tài liệu API (chỉ mount ở development, xem app.js).
 * Swagger UI tự tải và parse file YAML trên trình duyệt → backend không cần thư viện YAML.
 */
export const docsRouter = Router();

docsRouter.get('/openapi.yaml', (_req, res) => res.sendFile(OPENAPI_FILE));
docsRouter.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(null, { swaggerOptions: { url: OPENAPI_URL } }),
);
