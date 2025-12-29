import { apiClient } from '@/lib/api-client';
import type { DashboardResponse } from './type';

export function getDashboard() {
    return apiClient.get<DashboardResponse>('/api/v1/profile/dashboard');
}
