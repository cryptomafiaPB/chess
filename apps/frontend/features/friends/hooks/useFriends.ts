// features/friends/hooks/useFriends.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsApi, Friend, FriendRequest, SentRequest, BlockedUser } from '../api';

// Query keys
const friendsKeys = {
    all: ['friends'] as const,
    list: () => [...friendsKeys.all, 'list'] as const,
    pending: () => [...friendsKeys.all, 'pending'] as const,
    sent: () => [...friendsKeys.all, 'sent'] as const,
    blocked: () => [...friendsKeys.all, 'blocked'] as const,
    status: (userId: number) => [...friendsKeys.all, 'status', userId] as const,
};

// Get friends list
export function useFriends() {
    return useQuery({
        queryKey: friendsKeys.list(),
        queryFn: friendsApi.getFriends,
    });
}

// Get pending requests
export function usePendingRequests() {
    return useQuery({
        queryKey: friendsKeys.pending(),
        queryFn: friendsApi.getPendingRequests,
    });
}

// Get sent requests
export function useSentRequests() {
    return useQuery({
        queryKey: friendsKeys.sent(),
        queryFn: friendsApi.getSentRequests,
    });
}

// Get blocked users
export function useBlockedUsers() {
    return useQuery({
        queryKey: friendsKeys.blocked(),
        queryFn: friendsApi.getBlockedUsers,
    });
}

// Get friendship status
export function useFriendshipStatus(userId: number) {
    return useQuery({
        queryKey: friendsKeys.status(userId),
        queryFn: () => friendsApi.getFriendshipStatus(userId),
        enabled: !!userId,
    });
}

// Send friend request mutation
export function useSendFriendRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: friendsApi.sendFriendRequest,
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: friendsKeys.sent() });
            queryClient.invalidateQueries({ queryKey: friendsKeys.list() });
            queryClient.invalidateQueries({ queryKey: friendsKeys.pending() });
            queryClient.invalidateQueries({ queryKey: friendsKeys.status(userId) });
        },
    });
}

// Accept friend request mutation
export function useAcceptFriendRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: friendsApi.acceptFriendRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: friendsKeys.list() });
            queryClient.invalidateQueries({ queryKey: friendsKeys.pending() });
        },
    });
}

// Reject friend request mutation
export function useRejectFriendRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: friendsApi.rejectFriendRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: friendsKeys.pending() });
        },
    });
}

// Cancel sent request mutation
export function useCancelFriendRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: friendsApi.cancelFriendRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: friendsKeys.sent() });
        },
    });
}

// Remove friend mutation
export function useRemoveFriend() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: friendsApi.removeFriend,
        onSuccess: (_, friendId) => {
            queryClient.invalidateQueries({ queryKey: friendsKeys.list() });
            queryClient.invalidateQueries({ queryKey: friendsKeys.status(friendId) });
        },
    });
}

// Block user mutation
export function useBlockUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: friendsApi.blockUser,
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: friendsKeys.all });
            queryClient.invalidateQueries({ queryKey: friendsKeys.status(userId) });
        },
    });
}

// Unblock user mutation
export function useUnblockUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: friendsApi.unblockUser,
        onSuccess: (_, userId) => {
            queryClient.invalidateQueries({ queryKey: friendsKeys.blocked() });
            queryClient.invalidateQueries({ queryKey: friendsKeys.status(userId) });
        },
    });
}
