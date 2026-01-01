// features/dm/api.ts
import { apiClient } from '@/lib/api-client';

export interface DirectMessage {
    id: number;
    conversationId: number;
    senderId: number;
    senderUsername: string;
    senderAvatar: string | null;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface Conversation {
    id: number;
    friendId: number;
    friendUsername: string;
    friendAvatar: string | null;
    lastMessage: string | null;
    lastMessageAt: string;
    unreadCount: number;
    isOnline: boolean;
}

export const dmApi = {
    // Get all conversations
    async getConversations(): Promise<Conversation[]> {
        const response = await apiClient.get<{ success: boolean; data: Conversation[] }>(
            '/api/v1/dm/conversations'
        );
        return response.data;
    },

    // Get messages with a friend
    async getMessages(friendId: number, limit?: number, before?: number): Promise<DirectMessage[]> {
        let path = `/api/v1/dm/messages/${friendId}?`;
        if (limit) path += `limit=${limit}&`;
        if (before) path += `before=${before}`;
        const response = await apiClient.get<{ success: boolean; data: DirectMessage[] }>(path);
        return response.data;
    },

    // Send a message
    async sendMessage(friendId: number, message: string): Promise<DirectMessage> {
        const response = await apiClient.post<{ success: boolean; data: DirectMessage }>(
            `/api/v1/dm/messages/${friendId}`,
            { message }
        );
        return response.data;
    },

    // Mark messages as read
    async markAsRead(friendId: number): Promise<void> {
        await apiClient.post(`/api/v1/dm/messages/${friendId}/read`);
    },

    // Get unread message count
    async getUnreadCount(): Promise<number> {
        const response = await apiClient.get<{ success: boolean; data: { count: number } }>(
            '/api/v1/dm/unread'
        );
        return response.data.count;
    },
};
