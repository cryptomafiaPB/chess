// components/dm/MessageList.tsx
'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { DirectMessage } from '@/features/dm/api';

interface MessageListProps {
    messages: DirectMessage[];
    currentUserId: number;
    isLoading?: boolean;
}

function formatMessageDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    if (isToday) {
        return timeStr;
    }
    if (isYesterday) {
        return `Yesterday ${timeStr}`;
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    }) + ', ' + timeStr;
}

export function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <svg
                    className="mb-2 h-16 w-16 text-muted-foreground/30"
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
                <p className="text-muted-foreground">No messages yet</p>
                <p className="mt-1 text-sm text-muted-foreground/70">Send a message to start the conversation</p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
            <div className="flex-1" />
            {messages.map((msg, index) => {
                const isOwn = msg.senderId === currentUserId;
                const showAvatar =
                    !isOwn &&
                    (index === 0 || messages[index - 1]?.senderId !== msg.senderId);

                return (
                    <div
                        key={msg.id}
                        className={cn(
                            'mb-2 flex items-end gap-2',
                            isOwn ? 'flex-row-reverse' : 'flex-row'
                        )}
                    >
                        {!isOwn && (
                            <div className="w-8 flex-shrink-0">
                                {showAvatar && (
                                    <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500">
                                        {msg.senderAvatar ? (
                                            <img
                                                src={msg.senderAvatar}
                                                alt={msg.senderUsername}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                                                {msg.senderUsername.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        <div
                            className={cn(
                                'group relative max-w-[70%] rounded-2xl px-4 py-2',
                                isOwn
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-accent text-foreground'
                            )}
                        >
                            <p className="whitespace-pre-wrap break-words text-sm">{msg.message}</p>
                            <div
                                className={cn(
                                    'mt-1 flex items-center gap-1 text-[10px]',
                                    isOwn ? 'text-white/70' : 'text-muted-foreground'
                                )}
                            >
                                <span>{formatMessageDate(msg.createdAt)}</span>
                                {isOwn && (
                                    <span>
                                        {msg.isRead ? (
                                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                                            </svg>
                                        ) : (
                                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </svg>
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
}
