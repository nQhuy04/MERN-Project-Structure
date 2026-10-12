import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateJob, useUpdateJob } from '@/features/jobs/hooks/useJobs';
import { toDateTimeLocalValue } from '@/features/jobs/schedule';
import { Button } from '@/shared/components/ui/Button';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { FormError } from '@/shared/components/ui/FormError';
import { SelectField } from '@/shared/components/ui/Select';
import { TextField } from '@/shared/components/ui/TextField';
import { TextareaField } from '@/shared/components/ui/TextareaField';
import { ROLE_LABELS } from '@/shared/constants/roles';
import { applyServerErrors } from '@/shared/lib/form';
import { z } from '@/shared/lib/zod';

/** Tên trường trùng với API (`schedule.runAt`, `config.subject`...) → lỗi server gắn thẳng vào ô. */
const jobFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Nhập tên job').max(100),
    type: z.string().min(1, 'Chọn loại job'),
    schedule: z.object({
      kind: z.enum(['ONCE', 'INTERVAL']),
      runAt: z.string(),
      everyDays: z.number('Nhập số ngày').int().min(1, 'Tối thiểu 1').max(365, 'Tối đa 365'),
      time: z.string(),
    }),
    config: z.record(z.string(), z.unknown()),
  })
  .superRefine((values, ctx) => {
    if (values.schedule.kind === 'ONCE' && !values.schedule.runAt) {
      ctx.addIssue({ code: 'custom', path: ['schedule', 'runAt'], message: 'Chọn thời điểm chạy' });
    }
    if (
      values.schedule.kind === 'INTERVAL' &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(values.schedule.time)
    ) {
      ctx.addIssue({ code: 'custom', path: ['schedule', 'time'], message: 'Chọn giờ chạy' });
    }
  });

/**
 * @param {Object} values giá trị form
 * @returns {Object} lịch gửi API
 */
function toSchedulePayload({ kind, runAt, everyDays, time }) {
  return kind === 'ONCE'
    ? { kind, runAt: new Date(runAt).toISOString() }
    : { kind, everyDays, time };
}

/**
 * @param {Object} [job] job đang sửa
 * @param {Object[]} types
 * @returns {Object} giá trị mặc định của form
 */
function buildDefaultValues(job, types) {
  const schedule = job?.schedule ?? { kind: 'INTERVAL', everyDays: 1, time: '09:00' };
  const type = job?.type ?? types.find((item) => !item.isSystemOnly)?.type ?? '';
  return {
    name: job?.name ?? '',
    type,
    schedule: {
      kind: schedule.kind,
      runAt: schedule.runAt ? toDateTimeLocalValue(schedule.runAt) : '',
      everyDays: schedule.everyDays ?? 1,
      time: schedule.time ?? '09:00',
    },
    config: job?.config ?? { roles: [] },
  };
}

/**
 * Ô nhập config sinh từ mô tả của backend (`configFields`).
 * @param {Object} props `{ field, register, error }`
 */
function ConfigField({ field, register, error }) {
  const name = `config.${field.name}`;

  if (field.input === 'roles') {
    return (
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-fg">{field.label}</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <Checkbox key={role} label={label} value={role} {...register(name)} />
          ))}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
      </fieldset>
    );
  }

  if (field.input === 'textarea') {
    return <TextareaField label={field.label} rows={5} error={error} {...register(name)} />;
  }

  return (
    <TextField
      label={field.label}
      type={field.input === 'number' ? 'number' : 'text'}
      min={field.min}
      max={field.max}
      error={error}
      {...register(name, { valueAsNumber: field.input === 'number' })}
    />
  );
}

/**
 * Form tạo / sửa job. Sửa: không đổi được loại job.
 * @param {Object} props
 * @param {Object[]} props.types loại job (từ API)
 * @param {Object} [props.job] job đang sửa (bỏ trống = tạo mới)
 * @param {Function} props.onDone đóng form
 */
export function JobForm({ types, job, onDone }) {
  const createMutation = useCreateJob();
  const updateMutation = useUpdateJob();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobFormSchema),
    defaultValues: buildDefaultValues(job, types),
  });

  const selectedType = types.find((item) => item.type === watch('type'));
  const scheduleKind = watch('schedule.kind');
  const configFieldNames = selectedType?.configFields.map((field) => `config.${field.name}`) ?? [];

  const onSubmit = (values) => {
    const payload = {
      name: values.name,
      config: values.config,
      schedule: toSchedulePayload(values.schedule),
    };
    const callbacks = {
      onSuccess: (body) => {
        toast.success(body.message);
        onDone();
      },
      onError: (error) =>
        applyServerErrors(error, setError, [
          'name',
          'schedule.runAt',
          'schedule.everyDays',
          'schedule.time',
          ...configFieldNames,
        ]),
    };
    if (job) updateMutation.mutate({ jobId: job.id, changes: payload }, callbacks);
    else createMutation.mutate({ ...payload, type: values.type }, callbacks);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={job ? `Sửa job ${job.name}` : 'Tạo job mới'}
      className="space-y-4"
    >
      <FormError message={errors.root?.server?.message} />
      <TextField label="Tên job" error={errors.name?.message} {...register('name')} />

      {!job && (
        <SelectField
          label="Loại job"
          hint={selectedType?.description}
          options={types
            .filter((item) => !item.isSystemOnly)
            .map((item) => ({ value: item.type, label: item.label }))}
          {...register('type')}
        />
      )}

      {selectedType?.configFields.map((field) => (
        <ConfigField
          key={field.name}
          field={field}
          register={register}
          error={errors.config?.[field.name]?.message}
        />
      ))}

      <fieldset className="space-y-3 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm font-medium text-fg">Lịch chạy</legend>
        <div className="flex gap-5">
          <Checkbox type="radio" label="Lặp lại" value="INTERVAL" {...register('schedule.kind')} />
          <Checkbox type="radio" label="Một lần" value="ONCE" {...register('schedule.kind')} />
        </div>
        {scheduleKind === 'ONCE' ? (
          <TextField
            label="Thời điểm chạy"
            type="datetime-local"
            error={errors.schedule?.runAt?.message}
            {...register('schedule.runAt')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Mỗi (ngày)"
              type="number"
              min={1}
              max={365}
              error={errors.schedule?.everyDays?.message}
              {...register('schedule.everyDays', { valueAsNumber: true })}
            />
            <TextField
              label="Lúc (giờ máy chủ cấu hình)"
              type="time"
              error={errors.schedule?.time?.message}
              {...register('schedule.time')}
            />
          </div>
        )}
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="secondary" onClick={onDone}>
          Huỷ
        </Button>
        <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
          {job ? 'Lưu' : 'Tạo job'}
        </Button>
      </div>
    </form>
  );
}
