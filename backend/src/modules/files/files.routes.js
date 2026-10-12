import { Router } from 'express';
import { features } from '../../shared/config/features.js';
import { presignRateLimiter } from '../../shared/middlewares/rateLimit.js';
import { requireFeature } from '../../shared/middlewares/requireFeature.js';
import { validate } from '../../shared/middlewares/validate.js';
import { authenticate } from '../auth/auth.middleware.js';
import { filesController } from './files.controller.js';
import { fileIdParamsSchema, listFilesQuerySchema, presignFileBodySchema } from './files.schema.js';

/** /files — file cá nhân (chưa cấu hình R2 → 404). Chỉ chủ sở hữu thao tác trên file của mình. */
export const filesRouter = Router();

filesRouter.use(
  requireFeature(() => features.isStorageEnabled()),
  authenticate,
);

filesRouter.get('/', validate({ query: listFilesQuerySchema }), filesController.list);
filesRouter.post(
  '/presign',
  presignRateLimiter,
  validate({ body: presignFileBodySchema }),
  filesController.requestUpload,
);
filesRouter.post(
  '/:id/complete',
  validate({ params: fileIdParamsSchema }),
  filesController.completeUpload,
);
filesRouter.get(
  '/:id/download',
  validate({ params: fileIdParamsSchema }),
  filesController.getDownloadUrl,
);
filesRouter.delete('/:id', validate({ params: fileIdParamsSchema }), filesController.remove);
