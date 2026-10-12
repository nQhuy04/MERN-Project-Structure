import { healthService } from './health.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

async function getHealth(_req, res) {
  const health = await healthService.getHealth();
  sendSuccess(res, health);
}

export const healthController = { getHealth };
