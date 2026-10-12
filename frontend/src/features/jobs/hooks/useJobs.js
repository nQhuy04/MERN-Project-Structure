// check-conventions: allow-unused-imports — `jobsKeys` bên dưới là gợi ý cho bài 14.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createJob,
  deleteJob,
  jobsKeys,
  listJobRuns,
  listJobTypes,
  listJobs,
  runJob,
  setJobPaused,
  updateJob,
} from '@/features/jobs/api/jobs.api';

export function useJobs() {
  return useQuery({ queryKey: jobsKeys.list(), queryFn: listJobs });
}

export function useJobTypes() {
  return useQuery({ queryKey: jobsKeys.types(), queryFn: listJobTypes, staleTime: Infinity });
}

/** @param {string|null} jobId @param {number} page */
export function useJobRuns(jobId, page) {
  return useQuery({
    queryKey: jobsKeys.runs(jobId, page),
    queryFn: () => listJobRuns({ jobId, page }),
    enabled: Boolean(jobId),
    placeholderData: keepPreviousData,
  });
}

/** Mọi thay đổi job (kể cả chạy ngay → có lần chạy mới): làm mới danh sách + lịch sử. */
function useJobMutation(mutationFn) {
  const queryClient = useQueryClient();
  // TODO(bai-14): thêm `onSuccess` gọi
  // `queryClient.invalidateQueries({ queryKey: jobsKeys.all })` — tạo / sửa / tạm dừng / chạy
  // ngay đều làm danh sách job và lịch sử chạy cũ đi.
  return useMutation({
    mutationFn,
  });
}

export const useCreateJob = () => useJobMutation(createJob);
export const useUpdateJob = () => useJobMutation(updateJob);
export const useSetJobPaused = () => useJobMutation(setJobPaused);
export const useRunJob = () => useJobMutation(runJob);
export const useDeleteJob = () => useJobMutation(deleteJob);
