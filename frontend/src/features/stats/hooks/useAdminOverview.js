import { useQuery } from '@tanstack/react-query';
import { getAdminOverview, statsKeys } from '@/features/stats/api/stats.api';

export function useAdminOverview() {
  return useQuery({ queryKey: statsKeys.overview, queryFn: getAdminOverview });
}
