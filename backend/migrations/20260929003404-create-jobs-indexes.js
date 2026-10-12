/**
 * Index cho lịch tự động: jobs + job_runs. Tên trùng modules/jobs/jobs.model.js.
 */

const JOBS = 'jobs';
const JOB_RUNS = 'job_runs';
const JOB_RUN_RETENTION_SECONDS = 90 * 24 * 60 * 60;

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function up(db) {
  const jobs = db.collection(JOBS);
  const jobRuns = db.collection(JOB_RUNS);

  // Bộ chạy tìm job đến hạn: chưa tạm dừng, nextRunAt ≤ bây giờ.
  await jobs.createIndex({ isPaused: 1, nextRunAt: 1 }, { name: 'isPaused_nextRunAt' });
  await jobs.createIndex(
    { systemKey: 1 },
    {
      name: 'systemKey_unique',
      unique: true,
      partialFilterExpression: { systemKey: { $type: 'string' } },
    },
  );
  await jobRuns.createIndex({ jobId: 1, startedAt: -1 }, { name: 'jobId_startedAt' });
  // TTL: lịch sử chạy tự xoá sau 90 ngày.
  await jobRuns.createIndex(
    { startedAt: 1 },
    { name: 'startedAt_ttl', expireAfterSeconds: JOB_RUN_RETENTION_SECONDS },
  );
}

/**
 * @param {Object} db MongoDB Db (driver gốc, không phải Mongoose)
 * @returns {Promise} resolve khi xong
 */
export async function down(db) {
  await db.collection(JOB_RUNS).dropIndex('startedAt_ttl');
  await db.collection(JOB_RUNS).dropIndex('jobId_startedAt');
  await db.collection(JOBS).dropIndex('systemKey_unique');
  await db.collection(JOBS).dropIndex('isPaused_nextRunAt');
}
