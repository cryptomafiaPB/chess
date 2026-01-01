// src/features/auth/api.ts
import { apiClient, refreshAccessToken } from '@/lib/api-client';

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { email: string; username: string; password: string };

export async function login(payload: LoginPayload) {
    // backend: { success, data: { user, accessToken, refreshToken } }
    const resp = await apiClient.post('/api/v1/auth/login', payload);
    return resp.data ?? resp; // normalize
}

export async function register(payload: RegisterPayload) {
    // backend: { success, data: { user, accessToken, refreshToken } }
    const resp = await apiClient.post('/api/v1/auth/register', payload);
    return resp.data ?? resp;
}

export async function fetchMe() {
    const resp = await apiClient.get('/api/v1/auth/me');
    // backend: { success, data: { user } }
    return resp.data?.user ?? resp.data ?? resp;
}

/**
 * Manually refresh the access token
 * Returns true if refresh was successful
 */
export { refreshAccessToken };
