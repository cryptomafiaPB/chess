// src/lib/api-client.ts
'use client';

import {
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken,
    isAccessTokenExpired,
    clearAllTokens,
} from './auth-token';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || 'http://localhost:5000';

// Track if a refresh is in progress to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Queue of requests waiting for token refresh
type QueuedRequest = {
    resolve: (value: boolean) => void;
    reject: (reason?: any) => void;
};
let refreshQueue: QueuedRequest[] = [];

/**
 * Process the queue of waiting requests after token refresh
 */
function processQueue(success: boolean, error?: any): void {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (success) {
            resolve(true);
        } else {
            reject(error);
        }
    });
    refreshQueue = [];
}

/**
 * Refresh the access token using the refresh token
 * Returns true if refresh was successful
 */
async function refreshAccessToken(): Promise<boolean> {
    const refreshTokenValue = getRefreshToken();

    if (!refreshTokenValue) {
        console.log('No refresh token available');
        return false;
    }

    // If already refreshing, queue this request
    if (isRefreshing && refreshPromise) {
        return new Promise<boolean>((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
        });
    }

    isRefreshing = true;

    refreshPromise = (async () => {
        try {
            console.log('Refreshing access token...');

            const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
                method: 'POST',
                credentials: 'include', // Include cookies (for httpOnly refresh token if used)
                headers: {
                    'Content-Type': 'application/json',
                    // Send refresh token in header for mobile compatibility
                    'X-Refresh-Token': refreshTokenValue,
                },
            });

            if (!res.ok) {
                console.log('Token refresh failed with status:', res.status);
                // Refresh token is invalid/expired - clear all tokens
                clearAllTokens();
                processQueue(false, new Error('Token refresh failed'));
                return false;
            }

            const data = await res.json();
            const newAccessToken = data.data?.accessToken || data.accessToken;
            const newRefreshToken = data.data?.refreshToken || data.refreshToken;

            if (newAccessToken) {
                setAccessToken(newAccessToken);
                console.log('Access token refreshed successfully');
            }

            // If server returns a new refresh token (token rotation), update it
            if (newRefreshToken) {
                setRefreshToken(newRefreshToken);
                console.log('Refresh token rotated');
            }

            processQueue(true);
            return true;
        } catch (error) {
            console.error('Token refresh error:', error);
            clearAllTokens();
            processQueue(false, error);
            return false;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

/**
 * Ensure we have a valid access token before making a request
 */
async function ensureValidToken(): Promise<string | null> {
    const token = getAccessToken();
    const refreshTokenValue = getRefreshToken();
    const expired = isAccessTokenExpired();

    console.log('[api-client] ensureValidToken:', {
        hasToken: !!token,
        hasRefreshToken: !!refreshTokenValue,
        isExpired: expired
    });

    // No token at all
    if (!token) {
        // Try to refresh if we have a refresh token
        if (refreshTokenValue) {
            console.log('[api-client] No access token, attempting refresh...');
            const success = await refreshAccessToken();
            if (success) {
                return getAccessToken();
            }
        }
        return null;
    }

    // Token exists but might be expired
    if (expired) {
        console.log('[api-client] Access token expired, attempting refresh...');
        const success = await refreshAccessToken();
        if (success) {
            return getAccessToken();
        }
        return null;
    }

    return token;
}

/**
 * Main request function with automatic token refresh
 */
async function request<T>(
    path: string,
    options: RequestInit = {},
    retryCount = 0
): Promise<T> {
    // Ensure we have a valid token (refresh if needed)
    const token = await ensureValidToken();

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

    // Handle 401 - token might have expired between check and request
    if (res.status === 401 && retryCount < 1) {
        console.log('Got 401, attempting token refresh...');
        const refreshed = await refreshAccessToken();

        if (refreshed) {
            // Retry the request with new token
            return request<T>(path, options, retryCount + 1);
        }

        // Refresh failed - let the error propagate
        // The app should handle this by redirecting to login
        const error = new Error('Session expired. Please login again.');
        (error as any).status = 401;
        (error as any).isAuthError = true;
        throw error;
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
        const message =
            (data && (data.message || data.error)) ||
            res.statusText ||
            'Request failed';
        const error = new Error(message);
        (error as any).status = res.status;
        throw error;
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

/**
 * Export refresh function for manual refresh if needed
 */
export { refreshAccessToken };
