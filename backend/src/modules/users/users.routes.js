import { Router } from 'express';
import { authorize } from '../../shared/middlewares/authorize.js';
import { changePasswordRateLimiter } from '../../shared/middlewares/rateLimit.js';
import { validate } from '../../shared/middlewares/validate.js';
import { authenticate } from '../auth/auth.middleware.js';
import { changePasswordBodySchema } from '../auth/auth.schema.js';
import { updateAvatarBodySchema } from '../media/media.schema.js';
import { ADMIN_ROLES, USER_ROLES } from './users.constants.js';
import { usersController } from './users.controller.js';
import { usersAdminController } from './usersAdmin.controller.js';
import {
  changeRoleBodySchema,
  listUsersQuerySchema,
  userIdParamsSchema,
} from './usersAdmin.schema.js';
import { updateMeBodySchema } from './users.schema.js';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, usersController.getMe);
usersRouter.patch(
  '/me',
  authenticate,
  validate({ body: updateMeBodySchema }),
  usersController.updateMe,
);
usersRouter.patch(
  '/me/avatar',
  authenticate,
  validate({ body: updateAvatarBodySchema }),
  usersController.updateMyAvatar,
);
usersRouter.patch(
  '/me/password',
  authenticate,
  changePasswordRateLimiter,
  validate({ body: changePasswordBodySchema }),
  usersController.changeMyPassword,
);

/** /admin/users — quản lý người dùng. Lớp 1: chỉ ADMIN/SUPER_ADMIN; lớp 2 (ai với ai): service. */
export const adminUsersRouter = Router();

adminUsersRouter.use(authenticate, authorize(...ADMIN_ROLES));

adminUsersRouter.get('/', validate({ query: listUsersQuerySchema }), usersAdminController.list);
adminUsersRouter.patch(
  '/:id/lock',
  validate({ params: userIdParamsSchema }),
  usersAdminController.lock,
);
adminUsersRouter.patch(
  '/:id/unlock',
  validate({ params: userIdParamsSchema }),
  usersAdminController.unlock,
);
adminUsersRouter.patch(
  '/:id/role',
  authorize(USER_ROLES.SUPER_ADMIN),
  validate({ params: userIdParamsSchema, body: changeRoleBodySchema }),
  usersAdminController.changeRole,
);
