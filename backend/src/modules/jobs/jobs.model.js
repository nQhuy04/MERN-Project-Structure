import mongoose from 'mongoose';
import { SCHEDULE_KINDS } from './jobs.schedule.js';

export const JOB_RUN_STATUSES = Object.freeze({ SUCCESS: 'SUCCESS', FAILED: 'FAILED' });

/** Lịch sử chạy giữ 90 ngày (TTL). */
export const JOB_RUN_RETENTION_SECONDS = 90 * 24 * 60 * 60;

const scheduleSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: Object.values(SCHEDULE_KINDS), required: true },
    runAt: { type: Date }, // ONCE
    everyDays: { type: Number, min: 1, max: 365 }, // INTERVAL
    time: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, // INTERVAL, 'HH:mm'
    startDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ }, // INTERVAL, tuỳ chọn
  },
  { _id: false },
);

const jobSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, required: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Lịch nhúng: thuộc riêng job, kích thước cố định.
    schedule: { type: scheduleSchema, required: true },
    // null = không còn lần chạy nào (ONCE đã chạy).
    nextRunAt: { type: Date, default: null },
    // Khoá chống chạy trùng giữa nhiều tiến trình / nhiều lần kích hoạt.
    lockedAt: { type: Date, default: null },
    isPaused: { type: Boolean, default: false },
    // Job hệ thống do seed tạo (định danh ổn định): không xoá được, chỉ tạm dừng.
    systemKey: { type: String },
    lastRunAt: { type: Date, default: null },
    lastRunStatus: {
      type: String,
      enum: [...Object.values(JOB_RUN_STATUSES), null],
      default: null,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { collection: 'jobs', timestamps: true },
);

// Index tạo bằng migration (*-create-jobs-indexes.js), khai báo lại cùng tên.
jobSchema.index({ isPaused: 1, nextRunAt: 1 }, { name: 'isPaused_nextRunAt' });
jobSchema.index(
  { systemKey: 1 },
  {
    name: 'systemKey_unique',
    unique: true,
    partialFilterExpression: { systemKey: { $type: 'string' } },
  },
);

jobSchema.virtual('isSystem').get(function isSystem() {
  return Boolean(this.systemKey);
});

export const Job = mongoose.model('Job', jobSchema);

const jobRunSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, default: null },
    status: { type: String, enum: [...Object.values(JOB_RUN_STATUSES), null], default: null },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    // Chạy tay (nút "Chạy ngay") hay theo lịch.
    isManual: { type: Boolean, default: false },
  },
  { collection: 'job_runs' },
);

jobRunSchema.index({ jobId: 1, startedAt: -1 }, { name: 'jobId_startedAt' });
jobRunSchema.index(
  { startedAt: 1 },
  { name: 'startedAt_ttl', expireAfterSeconds: JOB_RUN_RETENTION_SECONDS },
);

export const JobRun = mongoose.model('JobRun', jobRunSchema);
