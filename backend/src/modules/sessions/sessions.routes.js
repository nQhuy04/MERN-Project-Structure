import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.js';
import { idParamsSchema } from '../../shared/utils/commonSchemas.js';
import { authenticate } from '../auth/auth.middleware.js';
import { sessionsController } from './sessions.controller.js';

/** Phiên đăng nhập của chính người dùng (mọi route đều cần đăng nhập). */
export const sessionsRouter = Router();

sessionsRouter.use(authenticate);

sessionsRouter.get('/', sessionsController.list);
sessionsRouter.delete('/', sessionsController.revokeOthers);
sessionsRouter.delete('/:id', validate({ params: idParamsSchema }), sessionsController.revoke);
