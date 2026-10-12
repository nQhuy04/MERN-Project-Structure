import { Router } from 'express';
import { features } from '../../shared/config/features.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { presignRateLimiter } from '../../shared/middlewares/rateLimit.js';
import { requireFeature } from '../../shared/middlewares/requireFeature.js';
import { validate } from '../../shared/middlewares/validate.js';
import { authenticate } from '../auth/auth.middleware.js';
import { ADMIN_ROLES } from '../users/users.constants.js';
import { mediaController } from './media.controller.js';
import {
  createFolderBodySchema,
  folderNameParamsSchema,
  listMediaQuerySchema,
  mediaIdParamsSchema,
  presignAvatarBodySchema,
  presignMediaBodySchema,
} from './media.schema.js';

const requireStorage = requireFeature(() => features.isStorageEnabled());

/** /media — hiển thị ảnh (công khai) và upload ảnh của người dùng (avatar). */
export const mediaRouter = Router();

mediaRouter.use(requireStorage);

mediaRouter.get(
  '/:id/content',
  validate({ params: mediaIdParamsSchema }),
  mediaController.redirectToContent,
);
mediaRouter.post(
  '/avatar/presign',
  authenticate,
  presignRateLimiter,
  validate({ body: presignAvatarBodySchema }),
  mediaController.requestAvatarUpload,
);
mediaRouter.post(
  '/:id/complete',
  authenticate,
  validate({ params: mediaIdParamsSchema }),
  mediaController.completeUpload,
);

/** /admin/media — thư viện ảnh hệ thống (ADMIN trở lên). */
export const adminMediaRouter = Router();

adminMediaRouter.use(requireStorage, authenticate, authorize(...ADMIN_ROLES));

adminMediaRouter.get('/', validate({ query: listMediaQuerySchema }), mediaController.list);
adminMediaRouter.get('/folders', mediaController.listFolders);
adminMediaRouter.post(
  '/folders',
  validate({ body: createFolderBodySchema }),
  mediaController.createFolder,
);
adminMediaRouter.delete(
  '/folders/:name',
  validate({ params: folderNameParamsSchema }),
  mediaController.deleteFolder,
);
adminMediaRouter.post(
  '/presign',
  presignRateLimiter,
  validate({ body: presignMediaBodySchema }),
  mediaController.requestUpload,
);
adminMediaRouter.post('/cleanup-orphans', mediaController.cleanupOrphans);
adminMediaRouter.delete('/:id', validate({ params: mediaIdParamsSchema }), mediaController.remove);
