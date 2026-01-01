'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMe } from '@/features/auth/hook/useAuth';
import { useFriends } from '@/features/friends/hooks/useFriends';
import {
    useConversations,
    useMessages,
    useSendMessage,
    useMarkAsRead,
    useDMSocket,
} from '@/features/dm/hooks/useDM';
import { ConversationList } from '@/components/dm/ConversationList';
import { MessageList } from '@/components/dm/MessageList';
import { MessageInput } from '@/components/dm/MessageInput';
import { ChatHeader } from '@/components/dm/ChatHeader';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const friendIdParam = searchParams.get('friend');

    const [selectedFriendId, setSelectedFriendId] = useState<number | null>(
        friendIdParam ? Number(friendIdParam) : null
    );
    const [showMobileChat, setShowMobileChat] = useState(false);

    const { data: me } = useMe();
    const { data: friends, isLoading: friendsLoading } = useFriends();
    const { data: conversations, isLoading: conversationsLoading } = useConversations();
    const { data: messages, isLoading: messagesLoading } = useMessages(selectedFriendId);
    const sendMessageMutation = useSendMessage();
    const markAsReadMutation = useMarkAsRead();

    // Socket hook for real-time updates - pass currentUserId
    const { sendTyping, isTyping } = useDMSocket(selectedFriendId, me?.id ?? null);

    // Handle friend selection from URL param
    useEffect(() => {
        if (friendIdParam) {
            setSelectedFriendId(Number(friendIdParam));
            setShowMobileChat(true);
        }
    }, [friendIdParam]);

    // Mark messages as read when viewing a conversation
    useEffect(() => {
        if (selectedFriendId && messages && messages.length > 0) {
            const hasUnread = messages.some(
                (msg) => msg.senderId === selectedFriendId && !msg.isRead
            );
            if (hasUnread) {
                markAsReadMutation.mutate(selectedFriendId);
            }
        }
    }, [selectedFriendId, messages]);

    const handleSelectConversation = useCallback((friendId: number) => {
        setSelectedFriendId(friendId);
        setShowMobileChat(true);
        router.push(`/messages?friend=${friendId}`, { scroll: false });
    }, [router]);

    const handleSendMessage = useCallback(
        (message: string) => {
            if (!selectedFriendId) return;
            sendMessageMutation.mutate({ friendId: selectedFriendId, message });
        },
        [selectedFriendId, sendMessageMutation]
    );

    const handleTyping = useCallback(
        (isTyping: boolean) => {
            if (selectedFriendId) {
                sendTyping(selectedFriendId, isTyping);
            }
        },
        [selectedFriendId, sendTyping]
    );

    const handleBack = useCallback(() => {
        setShowMobileChat(false);
        setSelectedFriendId(null);
        router.push('/messages', { scroll: false });
    }, [router]);

    // Get selected conversation data
    const selectedConversation = conversations?.find(
        (c) => c.friendId === selectedFriendId
    );

    // If we have a friendId but no conversation yet (new chat), create a placeholder
    const selectedFriend = friends?.find((f) => f.id === selectedFriendId);
    const conversationData = selectedConversation ?? (selectedFriend ? {
        id: 0,
        friendId: selectedFriend.id,
        friendUsername: selectedFriend.username,
        friendAvatar: selectedFriend.avatar,
        lastMessage: null,
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        isOnline: selectedFriend.isOnline,
    } : null);

    return (
        <div className="h-[calc(100vh-4rem)]">
            <div className="mx-auto flex h-full max-w-7xl overflow-hidden">
                {/* Conversation List - Hidden on mobile when chat is open */}
                <div
                    className={cn(
                        'w-full border-r border-border bg-card md:w-80 lg:w-96',
                        showMobileChat && 'hidden md:block'
                    )}
                >
                    <div className="flex h-16 items-center justify-between border-b border-border px-4">
                        <h1 className="text-xl font-bold">Messages</h1>
                        {/* New conversation button */}
                        <NewConversationButton
                            friends={friends ?? []}
                            existingConversations={conversations ?? []}
                            onSelectFriend={handleSelectConversation}
                        />
                    </div>
                    <div className="h-[calc(100%-4rem)] overflow-y-auto">
                        <ConversationList
                            conversations={conversations ?? []}
                            selectedFriendId={selectedFriendId}
                            onSelectConversation={handleSelectConversation}
                            isLoading={conversationsLoading}
                        />
                    </div>
                </div>

                {/* Chat Area */}
                <div
                    className={cn(
                        'flex flex-1 flex-col bg-background',
                        !showMobileChat && 'hidden md:flex'
                    )}
                >
                    <ChatHeader
                        conversation={conversationData}
                        onBack={handleBack}
                        isTyping={isTyping}
                    />

                    {selectedFriendId ? (
                        <>
                            <MessageList
                                messages={messages ?? []}
                                currentUserId={me?.id ?? 0}
                                isLoading={messagesLoading}
                            />
                            <MessageInput
                                onSendMessage={handleSendMessage}
                                onTyping={handleTyping}
                                disabled={sendMessageMutation.isPending}
                            />
                        </>
                    ) : (
                        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                            <svg
                                className="mb-4 h-24 w-24 text-muted-foreground/30"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                            <h2 className="text-xl font-semibold text-muted-foreground">
                                Select a conversation
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground/70">
                                Choose a friend to start messaging
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// New Conversation Button Component
import { useState as useDropdownState } from 'react';
import type { Friend } from '@/features/friends/api';
import type { Conversation } from '@/features/dm/api';

function NewConversationButton({
    friends,
    existingConversations,
    onSelectFriend,
}: {
    friends: Friend[];
    existingConversations: Conversation[];
    onSelectFriend: (friendId: number) => void;
}) {
    const [isOpen, setIsOpen] = useDropdownState(false);

    // Filter out friends who already have conversations
    const existingFriendIds = new Set(existingConversations.map((c) => c.friendId));
    const newFriends = friends.filter((f) => !existingFriendIds.has(f.id));

    if (newFriends.length === 0) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-lg p-2 hover:bg-accent"
                title="New conversation"
            >
                <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-card shadow-lg">
                        <div className="border-b border-border px-4 py-3">
                            <h3 className="font-semibold">New Conversation</h3>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2">
                            {newFriends.map((friend) => (
                                <button
                                    key={friend.id}
                                    onClick={() => {
                                        onSelectFriend(friend.id);
                                        setIsOpen(false);
                                    }}
                                    className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-accent"
                                >
                                    <div className="relative">
                                        <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500">
                                            {friend.avatar ? (
                                                <img
                                                    src={friend.avatar}
                                                    alt={friend.username}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                                                    {friend.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        {friend.isOnline && (
                                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                                        )}
                                    </div>
                                    <span className="font-medium">{friend.username}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
