import { Router } from 'express';
import { authorize } from '../../shared/middlewares/authorize.js';
import { testEmailRateLimiter } from '../../shared/middlewares/rateLimit.js';
import { validate } from '../../shared/middlewares/validate.js';
import { authenticate } from '../auth/auth.middleware.js';
import { USER_ROLES } from '../users/users.constants.js';
import { settingsController } from './settings.controller.js';
import { sendTestEmailBodySchema, updateSettingsBodySchema } from './settings.schema.js';

/** /settings — công khai, không cần đăng nhập. */
export const settingsRouter = Router();

settingsRouter.get('/public', settingsController.getPublic);

/** /admin/settings — chỉ Super Admin. */
export const adminSettingsRouter = Router();

adminSettingsRouter.use(authenticate, authorize(USER_ROLES.SUPER_ADMIN));

adminSettingsRouter.get('/', settingsController.listForAdmin);
adminSettingsRouter.patch(
  '/',
  validate({ body: updateSettingsBodySchema }),
  settingsController.update,
);
adminSettingsRouter.post(
  '/email-test',
  testEmailRateLimiter,
  validate({ body: sendTestEmailBodySchema }),
  settingsController.sendTestEmail,
);
