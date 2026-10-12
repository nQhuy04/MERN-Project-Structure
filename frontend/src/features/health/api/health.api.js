import { http } from '@/shared/lib/http';

/** Query key factory của feature health. */
export const healthKeys = {
  all: ['health'],
};

/**
 * @returns {Promise} resolve HealthStatus
 * @throws {ApiError} SERVICE_UNAVAILABLE khi DB không phản hồi, NETWORK_ERROR khi không gọi được API
 */
export async function getHealth() {
  const response = await http.get('/health');
  return response.data.data;
}
