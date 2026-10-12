// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 14.
import { sendSuccess } from '../../shared/utils/response.js';
import { notImplemented } from '../../shared/errors/notImplemented.js';
import { statsService } from './stats.service.js';

/** **[BÀI 14]** `GET /admin/stats`. Một dòng: `sendSuccess` với kết quả của service. */
async function getOverview(_req, res) {
  return notImplemented('bai-14');
}

export const statsController = { getOverview };
