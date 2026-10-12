import { Router } from 'express';
import { authorize } from '../../shared/middlewares/authorize.js';
import { authenticate } from '../auth/auth.middleware.js';
import { ADMIN_ROLES } from '../users/users.constants.js';
import { statsController } from './stats.controller.js';

/** /admin/stats — số liệu tổng quan cho khu quản trị. */
export const adminStatsRouter = Router();

adminStatsRouter.get('/', authenticate, authorize(...ADMIN_ROLES), statsController.getOverview);
