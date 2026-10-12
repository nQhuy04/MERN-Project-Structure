import { Router } from 'express';
import { authorize } from '../../shared/middlewares/authorize.js';
import { createRateLimiter } from '../../shared/middlewares/rateLimit.js';
import { validate } from '../../shared/middlewares/validate.js';
import { authenticate } from '../auth/auth.middleware.js';
import { USER_ROLES } from '../users/users.constants.js';
import { jobsController } from './jobs.controller.js';
import { requireJobsSecret } from './jobs.middleware.js';
import {
  createJobBodySchema,
  jobIdParamsSchema,
  listJobRunsQuerySchema,
  updateJobBodySchema,
} from './jobs.schema.js';

/** /jobs — endpoint cho cron bên ngoài. */
export const jobsRouter = Router();

jobsRouter.post(
  '/trigger',
  createRateLimiter({ windowMs: 60 * 1000, limit: 10 }),
  requireJobsSecret,
  jobsController.trigger,
);

/** /admin/jobs — lịch tự động, chỉ Super Admin (job gửi email hàng loạt là thao tác rủi ro). */
export const adminJobsRouter = Router();

adminJobsRouter.use(authenticate, authorize(USER_ROLES.SUPER_ADMIN));

const withId = validate({ params: jobIdParamsSchema });

adminJobsRouter.get('/', jobsController.list);
adminJobsRouter.get('/types', jobsController.listTypes);
adminJobsRouter.post('/', validate({ body: createJobBodySchema }), jobsController.create);
adminJobsRouter.patch(
  '/:id',
  validate({ params: jobIdParamsSchema, body: updateJobBodySchema }),
  jobsController.update,
);
adminJobsRouter.post('/:id/pause', withId, jobsController.pause);
adminJobsRouter.post('/:id/resume', withId, jobsController.resume);
adminJobsRouter.post('/:id/run', withId, jobsController.runNow);
adminJobsRouter.delete('/:id', withId, jobsController.remove);
adminJobsRouter.get(
  '/:id/runs',
  validate({ params: jobIdParamsSchema, query: listJobRunsQuerySchema }),
  jobsController.listRuns,
);
