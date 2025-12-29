// features/friends/api.ts
import { apiClient } from '@/lib/api-client';

export interface Friend {
    id: number;
    username: string;
    avatar: string | null;
    isOnline: boolean;
    rating?: number;
    friendsSince?: string;
}

export interface FriendRequest {
    id: number;
    senderId: number;
    senderUsername: string;
    senderAvatar: string | null;
    createdAt: string;
}

export interface SentRequest {
    id: number;
    receiverId: number;
    receiverUsername: string;
    receiverAvatar: string | null;
    createdAt: string;
}

export interface BlockedUser {
    id: number;
    userId: number;
    username: string;
    avatar: string | null;
}

// Backend returns: 'none' | 'active' | 'blocked' | 'request_sent' | 'request_received'
export type FriendshipStatus = 'none' | 'active' | 'blocked' | 'request_sent' | 'request_received';

export const friendsApi = {
    // Get friends list
    async getFriends(): Promise<Friend[]> {
        const response = await apiClient.get<{ success: boolean; data: Friend[] }>(
            '/api/v1/friends/list'
        );
        return response.data;
    },

    // Get pending friend requests (received)
    async getPendingRequests(): Promise<FriendRequest[]> {
        const response = await apiClient.get<{ success: boolean; data: FriendRequest[] }>(
            '/api/v1/friends/requests/pending'
        );
        return response.data;
    },

    // Get sent friend requests
    async getSentRequests(): Promise<SentRequest[]> {
        const response = await apiClient.get<{ success: boolean; data: SentRequest[] }>(
            '/api/v1/friends/requests/sent'
        );
        return response.data;
    },

    // Get blocked users
    async getBlockedUsers(): Promise<BlockedUser[]> {
        const response = await apiClient.get<{ success: boolean; data: BlockedUser[] }>(
            '/api/v1/friends/blocked'
        );
        return response.data;
    },

    // Send friend request
    async sendFriendRequest(receiverId: number): Promise<void> {
        await apiClient.post('/api/v1/friends/request', { receiverId });
    },

    // Accept friend request
    async acceptFriendRequest(requestId: number): Promise<void> {
        await apiClient.post(`/api/v1/friends/request/${requestId}/accept`);
    },

    // Reject friend request
    async rejectFriendRequest(requestId: number): Promise<void> {
        await apiClient.post(`/api/v1/friends/request/${requestId}/reject`);
    },

    // Cancel sent friend request
    async cancelFriendRequest(requestId: number): Promise<void> {
        await apiClient.delete(`/api/v1/friends/request/${requestId}`);
    },

    // Remove friend
    async removeFriend(friendId: number): Promise<void> {
        await apiClient.delete(`/api/v1/friends/${friendId}`);
    },

    // Block user
    async blockUser(userId: number): Promise<void> {
        await apiClient.post('/api/v1/friends/block', { userId });
    },

    // Unblock user
    async unblockUser(userId: number): Promise<void> {
        await apiClient.delete(`/api/v1/friends/block/${userId}`);
    },

    // Get friendship status with a user
    async getFriendshipStatus(userId: number): Promise<FriendshipStatus> {
        const response = await apiClient.get<{ success: boolean; data: { status: FriendshipStatus } }>(
            `/api/v1/friends/status/${userId}`
        );
        return response.data.status;
    },
};
