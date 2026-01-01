// src/features/auth/hooks/useAuth.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, register, fetchMe } from '../api';
import { useRouter } from 'next/navigation';
import { setAccessToken, setRefreshToken, clearAllTokens, hasValidSession, getAccessToken } from '@/lib/auth-token';
import { reconnectSocketWithAuth, disconnectSocket } from '@/lib/socket-client';
import { useState, useEffect, useSyncExternalStore } from 'react';

const ACCESS_TOKEN_KEY = ['auth', 'accessToken'] as const;

/**
 * Hook to check if client-side hydration is complete
 */
function useIsHydrated() {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    return isHydrated;
}

/**
 * Check session status - must be called after hydration
 */
function checkHasSession(): boolean {
    if (typeof window === 'undefined') return false;
    return hasValidSession() || !!getAccessToken();
}

export function useMe() {
    const isHydrated = useIsHydrated();
    const [sessionChecked, setSessionChecked] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        if (isHydrated && !sessionChecked) {
            const session = checkHasSession();
            console.log('[useMe] Session check:', { isHydrated, session });
            setHasSession(session);
            setSessionChecked(true);
        }
    }, [isHydrated, sessionChecked]);

    const query = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            console.log('[useMe] Fetching user data...');
            const result = await fetchMe();
            console.log('[useMe] Fetch result:', result);
            return result;
        },
        retry: false,
        // Only fetch if we're hydrated, checked session, and have a session
        enabled: isHydrated && sessionChecked && hasSession,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Return enhanced loading state that accounts for pre-query initialization
    return {
        ...query,
        // isLoading is true if:
        // 1. Not yet hydrated
        // 2. Session not checked yet
        // 3. Have session but query is still loading
        isLoading: !isHydrated || !sessionChecked || (hasSession && query.isLoading),
        // Only redirect to login if we've checked and there's no session, or query failed
        isError: query.isError || (sessionChecked && !hasSession),
    };
}

export function useAccessToken() {
    const queryClient = useQueryClient();
    return queryClient.getQueryData<string | null>(ACCESS_TOKEN_KEY) ?? null;
}

export function useLogin() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: login,
        onSuccess: (data: any) => {
            const user = data.user;
            const accessToken = data.accessToken;
            const refreshToken = data.refreshToken;

            console.log("Login Success:", { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });

            if (user) {
                queryClient.setQueryData(['auth', 'me'], user);
            }

            // Store both tokens
            if (accessToken) {
                queryClient.setQueryData(ACCESS_TOKEN_KEY, accessToken);
                setAccessToken(accessToken);
            }
            if (refreshToken) {
                setRefreshToken(refreshToken);
            }

            // Reconnect socket with new auth token
            if (accessToken) {
                reconnectSocketWithAuth();
            }

            router.push('/play');
        },
    });
}

export function useRegister() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: register,
        onSuccess: (data: any) => {
            const user = data.user;
            const accessToken = data.accessToken;
            const refreshToken = data.refreshToken;

            console.log("Register Success:", { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });

            if (user) {
                queryClient.setQueryData(['auth', 'me'], user);
            }

            // Store both tokens
            if (accessToken) {
                queryClient.setQueryData(ACCESS_TOKEN_KEY, accessToken);
                setAccessToken(accessToken);
            }
            if (refreshToken) {
                setRefreshToken(refreshToken);
            }

            // Reconnect socket with new auth token
            if (accessToken) {
                reconnectSocketWithAuth();
            }

            router.push('/play');
        },
    });
}

/**
 * Hook for logging out - clears auth state and disconnects socket
 */
export function useLogout() {
    const router = useRouter();
    const queryClient = useQueryClient();

    return () => {
        // Clear all tokens (access + refresh)
        clearAllTokens();

        // Clear query cache
        queryClient.setQueryData(['auth', 'me'], null);
        queryClient.setQueryData(ACCESS_TOKEN_KEY, null);
        queryClient.clear();

        // Disconnect socket
        disconnectSocket();

        // Redirect to login
        router.push('/login');
    };
}
