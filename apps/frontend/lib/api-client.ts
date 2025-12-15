// src/lib/api-client.ts
'use client';

import { getAccessToken } from './auth-token';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || 'http://localhost:5000';

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAccessToken();


    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }



    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        credentials: 'include', // for refresh token cookie
        headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const message =
            (data && (data.message || data.error)) ||
            res.statusText ||
            'Request failed';
        throw new Error(message);
    }

    return data;
}

export const apiClient = {
    get<T = any>(path: string) {
        return request<T>(path, { method: 'GET' });
    },
    post<T = any>(path: string, body?: any) {
        return request<T>(path, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    },
    patch<T = any>(path: string, body?: any) {
        return request<T>(path, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    },
    delete<T = any>(path: string, body?: any) {
        return request<T>(path, {
            method: 'DELETE',
            body: body ? JSON.stringify(body) : undefined,
        });
    },
};
