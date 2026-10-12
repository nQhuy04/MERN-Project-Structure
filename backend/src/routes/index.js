import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { filesRouter } from '../modules/files/files.routes.js';
import { healthRouter } from '../modules/health/health.routes.js';
import { adminJobsRouter, jobsRouter } from '../modules/jobs/jobs.routes.js';
import { adminMediaRouter, mediaRouter } from '../modules/media/media.routes.js';
import { sessionsRouter } from '../modules/sessions/sessions.routes.js';
import { adminSettingsRouter, settingsRouter } from '../modules/settings/settings.routes.js';
import { adminStatsRouter } from '../modules/stats/stats.routes.js';
import { adminUsersRouter, usersRouter } from '../modules/users/users.routes.js';

/** Router tổng, được mount tại /api/v1 trong app.js. */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/sessions', sessionsRouter);
apiRouter.use('/files', filesRouter);
apiRouter.use('/media', mediaRouter);
apiRouter.use('/admin/media', adminMediaRouter);
apiRouter.use('/jobs', jobsRouter);
apiRouter.use('/admin/jobs', adminJobsRouter);
apiRouter.use('/admin/stats', adminStatsRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/admin/settings', adminSettingsRouter);
apiRouter.use('/admin/users', adminUsersRouter);
