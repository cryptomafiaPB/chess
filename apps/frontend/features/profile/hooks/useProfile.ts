// features/profile/hooks/useProfile.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, UserPreferences } from '../api';

export function useProfile(userId: string) {
    return useQuery({
        queryKey: ['profile', userId],
        queryFn: () => profileApi.getProfile(userId),
        enabled: !!userId,
        staleTime: 30000, // 30 seconds
    });
}

export function useDashboard() {
    return useQuery({
        queryKey: ['profile', 'dashboard'],
        queryFn: () => profileApi.getDashboard(),
        staleTime: 30000, // 30 seconds
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: profileApi.updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        },
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: profileApi.changePassword,
    });
}

export function useUpdateAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: profileApi.updateAvatar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        },
    });
}

export function usePreferences() {
    return useQuery({
        queryKey: ['profile', 'preferences'],
        queryFn: () => profileApi.getPreferences(),
        staleTime: 60000, // 1 minute
    });
}

export function useUpdatePreferences() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (preferences: Partial<UserPreferences>) => profileApi.updatePreferences(preferences),
        onSuccess: (data) => {
            queryClient.setQueryData(['profile', 'preferences'], data);
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: profileApi.deleteAccount,
        onSuccess: () => {
            queryClient.clear();
        },
    });
}

export function useLeaderboard(timeControl: string, limit: number = 50) {
    return useQuery({
        queryKey: ['leaderboard', timeControl, limit],
        queryFn: () => profileApi.getLeaderboard(timeControl, limit),
        staleTime: 60000, // 1 minute - leaderboards don't change that often
    });
}

export function useSearchUsers(query: string, limit: number = 10) {
    return useQuery({
        queryKey: ['search', 'users', query, limit],
        queryFn: () => profileApi.searchUsers(query, limit),
        enabled: query.length >= 2,
        staleTime: 10000, // 10 seconds
    });
}
