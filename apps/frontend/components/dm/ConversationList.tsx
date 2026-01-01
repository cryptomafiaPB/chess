// components/dm/ConversationList.tsx
'use client';

import { cn } from '@/lib/utils';
import { Conversation } from '@/features/dm/api';

// Helper function to format relative time
function formatDistanceToNow(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ConversationListProps {
    conversations: Conversation[];
    selectedFriendId: number | null;
    onSelectConversation: (friendId: number) => void;
    isLoading?: boolean;
}

export function ConversationList({
    conversations,
    selectedFriendId,
    onSelectConversation,
    isLoading,
}: ConversationListProps) {
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <svg
                    className="mb-2 h-12 w-12 text-muted-foreground/50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                    Start a conversation with a friend
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {conversations.map((conv) => (
                <button
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.friendId)}
                    className={cn(
                        'flex items-center gap-3 border-b border-border/50 p-4 text-left transition-colors hover:bg-accent/50',
                        selectedFriendId === conv.friendId && 'bg-accent'
                    )}
                >
                    <div className="relative flex-shrink-0">
                        <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500">
                            {conv.friendAvatar ? (
                                <img
                                    src={conv.friendAvatar}
                                    alt={conv.friendUsername}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                                    {conv.friendUsername.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {conv.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
                        )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{conv.friendUsername}</span>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(conv.lastMessageAt))}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="truncate text-sm text-muted-foreground">
                                {conv.lastMessage || 'No messages yet'}
                            </p>
                            {conv.unreadCount > 0 && (
                                <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-medium text-white">
                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                </span>
                            )}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
