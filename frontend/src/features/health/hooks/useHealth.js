import { useQuery } from '@tanstack/react-query';
import { getHealth, healthKeys } from '@/features/health/api/health.api';

/**
 * Trạng thái API + database.
 * @returns {Object} kết quả useQuery với `data` là HealthStatus
 */
export function useHealth() {
  return useQuery({
    queryKey: healthKeys.all,
    queryFn: getHealth,
  });
}
