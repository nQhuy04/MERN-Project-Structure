// check-conventions: allow-unused-imports — import dưới đây là gợi ý cho bài 14.
import { http } from '@/shared/lib/http';
import { notImplemented } from '@/shared/lib/practice';

/** Query key factory của feature jobs (lịch tự động). */
export const jobsKeys = {
  all: ['jobs'],
  list: () => [...jobsKeys.all, 'list'],
  types: () => [...jobsKeys.all, 'types'],
  runs: (jobId, page) => [...jobsKeys.all, 'runs', jobId, page],
};

/** @returns {Promise} resolve mảng job */
export async function listJobs() {
  return notImplemented('bai-14');
}

/** @returns {Promise} resolve mô tả các loại job (`configFields` để sinh form) */
export async function listJobTypes() {
  return notImplemented('bai-14');
}

/**
 * @param {Object} body `{ name, type, config, schedule }`
 * @returns {Promise} resolve body response
 */
export async function createJob(body) {
  return notImplemented('bai-14');
}

/**
 * @param {Object} params `{ jobId, changes }` — changes: `{ name?, config?, schedule? }`
 * @returns {Promise} resolve body response
 */
export async function updateJob({ jobId, changes }) {
  return notImplemented('bai-14');
}

/** @param {Object} params `{ jobId, isPaused }` @returns {Promise} resolve body response */
export async function setJobPaused({ jobId, isPaused }) {
  return notImplemented('bai-14');
}

/** @param {string} jobId @returns {Promise} resolve body response (`data` = lần chạy) */
export async function runJob(jobId) {
  return notImplemented('bai-14');
}

/** @param {string} jobId @returns {Promise} resolve body response */
export async function deleteJob(jobId) {
  return notImplemented('bai-14');
}

/**
 * @param {Object} params `{ jobId, page }`
 * @returns {Promise} resolve `{ items, meta }`
 */
export async function listJobRuns({ jobId, page }) {
  return notImplemented('bai-14');
}
