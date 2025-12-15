// src/features/auth/hooks/useAuth.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { login, register, fetchMe } from '../api';
import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/auth-token';

const ACCESS_TOKEN_KEY = ['auth', 'accessToken'] as const;

export function useMe() {
    return useQuery({
        queryKey: ['auth', 'me'],
        queryFn: fetchMe,
        retry: false,
    });
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

            console.log("Login Success:", data.accessToken);

            if (user) {
                queryClient.setQueryData(['auth', 'me'], user);
            }
            if (accessToken) {
                queryClient.setQueryData(ACCESS_TOKEN_KEY, accessToken);
                setAccessToken(accessToken);
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

            if (user) {
                queryClient.setQueryData(['auth', 'me'], user);
            }
            if (accessToken) {
                queryClient.setQueryData(ACCESS_TOKEN_KEY, accessToken);
                setAccessToken(accessToken);
            }

            router.push('/play');
        },
    });
}
