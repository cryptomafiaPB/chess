// features/dm/hooks/useDM.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback, useRef, useState } from 'react';
import { dmApi, DirectMessage } from '../api';
import { getSocketClient } from '@/lib/socket-client';

// Query keys
export const dmKeys = {
    all: ['dm'] as const,
    conversations: () => [...dmKeys.all, 'conversations'] as const,
    messages: (friendId: number) => [...dmKeys.all, 'messages', friendId] as const,
    unreadCount: () => [...dmKeys.all, 'unread'] as const,
};

// Get all conversations
export function useConversations() {
    return useQuery({
        queryKey: dmKeys.conversations(),
        queryFn: dmApi.getConversations,
        refetchInterval: 30000,
    });
}

// Get messages with a friend
export function useMessages(friendId: number | null) {
    return useQuery({
        queryKey: friendId ? dmKeys.messages(friendId) : ['disabled'],
        queryFn: () => (friendId ? dmApi.getMessages(friendId) : Promise.resolve([])),
        enabled: !!friendId,
    });
}

// Get unread count
export function useUnreadCount() {
    return useQuery({
        queryKey: dmKeys.unreadCount(),
        queryFn: dmApi.getUnreadCount,
        refetchInterval: 30000,
    });
}

// Send message via socket for real-time
export function useSendMessage() {
    const queryClient = useQueryClient();
    const [isPending, setIsPending] = useState(false);

    const sendMessage = useCallback(
        async ({ friendId, message }: { friendId: number; message: string }) => {
            setIsPending(true);
            const socket = getSocketClient();

            return new Promise<DirectMessage>((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    setIsPending(false);
                    reject(new Error('Message send timeout'));
                }, 10000);

                socket.emit(
                    'dm:send',
                    { friendId, message },
                    (response: { success: boolean; message?: DirectMessage; error?: string }) => {
                        clearTimeout(timeoutId);
                        setIsPending(false);
                        if (response.success && response.message) {
                            // Optimistically add to cache
                            queryClient.setQueryData<DirectMessage[]>(
                                dmKeys.messages(friendId),
                                (old) => {
                                    if (!old) return [response.message!];
                                    if (old.some((m) => m.id === response.message!.id)) return old;
                                    return [...old, response.message!];
                                }
                            );
                            queryClient.invalidateQueries({ queryKey: dmKeys.conversations() });
                            resolve(response.message);
                        } else {
                            reject(new Error(response.error || 'Failed to send message'));
                        }
                    }
                );
            });
        },
        [queryClient]
    );

    return {
        mutate: (params: { friendId: number; message: string }) => {
            sendMessage(params).catch(console.error);
        },
        mutateAsync: sendMessage,
        isPending,
    };
}

// Mark messages as read via socket
export function useMarkAsRead() {
    const queryClient = useQueryClient();

    const markAsRead = useCallback(
        (friendId: number) => {
            const socket = getSocketClient();

            socket.emit(
                'dm:markRead',
                { friendId },
                (response: { success: boolean; error?: string }) => {
                    if (response.success) {
                        // Update local cache
                        queryClient.setQueryData<DirectMessage[]>(
                            dmKeys.messages(friendId),
                            (old) =>
                                old?.map((msg) =>
                                    msg.senderId === friendId ? { ...msg, isRead: true } : msg
                                ) ?? []
                        );
                        queryClient.invalidateQueries({ queryKey: dmKeys.conversations() });
                        queryClient.invalidateQueries({ queryKey: dmKeys.unreadCount() });
                    }
                }
            );
        },
        [queryClient]
    );

    return {
        mutate: markAsRead,
    };
}

// Global DM socket hook - handles all incoming DM events
export function useDMSocket(selectedFriendId: number | null, currentUserId: number | null) {
    const queryClient = useQueryClient();
    const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
    const typingTimeoutsRef = useRef<Record<number, NodeJS.Timeout>>({});

    useEffect(() => {
        if (!currentUserId) return;

        const socket = getSocketClient();

        // Handle receiving new messages
        const handleNewMessage = (message: DirectMessage) => {
            console.log('📩 DM received:', message);

            // Determine which friend's conversation this belongs to
            const friendId = message.senderId === currentUserId
                ? null // This was sent by me, already handled by send callback
                : message.senderId;

            if (friendId) {
                // Add to the friend's message cache
                queryClient.setQueryData<DirectMessage[]>(
                    dmKeys.messages(friendId),
                    (old) => {
                        if (!old) return [message];
                        if (old.some((m) => m.id === message.id)) return old;
                        return [...old, message];
                    }
                );
            }

            // Always update conversations and unread count
            queryClient.invalidateQueries({ queryKey: dmKeys.conversations() });
            queryClient.invalidateQueries({ queryKey: dmKeys.unreadCount() });
        };

        // Handle typing indicators
        const handleTyping = (data: { userId: number; isTyping: boolean }) => {
            const { userId, isTyping } = data;

            // Clear existing timeout
            if (typingTimeoutsRef.current[userId]) {
                clearTimeout(typingTimeoutsRef.current[userId]);
            }

            if (isTyping) {
                setTypingUsers((prev) => ({ ...prev, [userId]: true }));
                // Auto-clear after 3 seconds
                typingTimeoutsRef.current[userId] = setTimeout(() => {
                    setTypingUsers((prev) => ({ ...prev, [userId]: false }));
                }, 3000);
            } else {
                setTypingUsers((prev) => ({ ...prev, [userId]: false }));
            }
        };

        // Handle messages read notification
        const handleMessagesRead = (data: { userId: number }) => {
            console.log('✓ Messages read by:', data.userId);

            // Update all messages sent to this user as read
            const friendId = data.userId;
            queryClient.setQueryData<DirectMessage[]>(
                dmKeys.messages(friendId),
                (old) =>
                    old?.map((msg) =>
                        msg.senderId === currentUserId ? { ...msg, isRead: true } : msg
                    ) ?? []
            );

            // Also refresh conversations to update any UI
            queryClient.invalidateQueries({ queryKey: dmKeys.conversations() });
        };

        socket.on('dm:receive', handleNewMessage);
        socket.on('dm:typing', handleTyping);
        socket.on('dm:messagesRead', handleMessagesRead);

        return () => {
            socket.off('dm:receive', handleNewMessage);
            socket.off('dm:typing', handleTyping);
            socket.off('dm:messagesRead', handleMessagesRead);

            // Clear all typing timeouts
            Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
        };
    }, [queryClient, currentUserId]);

    // Function to emit typing status
    const sendTyping = useCallback((friendId: number, isTyping: boolean) => {
        const socket = getSocketClient();
        socket.emit('dm:typing', { friendId, isTyping });
    }, []);

    // Check if a specific friend is typing
    const isTyping = selectedFriendId ? typingUsers[selectedFriendId] ?? false : false;

    return { sendTyping, typingUsers, isTyping };
}
