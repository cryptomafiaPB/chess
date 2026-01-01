// components/dm/ChatHeader.tsx
'use client';

import Link from 'next/link';
import { Conversation } from '@/features/dm/api';

interface ChatHeaderProps {
    conversation: Conversation | null;
    onBack?: () => void;
    isTyping?: boolean;
}

export function ChatHeader({ conversation, onBack, isTyping }: ChatHeaderProps) {
    if (!conversation) {
        return (
            <div className="flex h-16 items-center border-b border-border px-4">
                <span className="text-muted-foreground">Select a conversation</span>
            </div>
        );
    }

    return (
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
            {onBack && (
                <button
                    onClick={onBack}
                    className="mr-1 rounded-lg p-1 hover:bg-accent md:hidden"
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}
            <Link href={`/profile/${conversation.friendId}`} className="flex items-center gap-3">
                <div className="relative">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500">
                        {conversation.friendAvatar ? (
                            <img
                                src={conversation.friendAvatar}
                                alt={conversation.friendUsername}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                                {conversation.friendUsername.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    {conversation.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />
                    )}
                </div>
                <div>
                    <h2 className="font-semibold">{conversation.friendUsername}</h2>
                    <p className="text-xs text-muted-foreground">
                        {isTyping ? (
                            <span className="flex items-center gap-1 text-emerald-500">
                                <span className="flex gap-0.5">
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: '0ms' }} />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: '150ms' }} />
                                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: '300ms' }} />
                                </span>
                                typing...
                            </span>
                        ) : conversation.isOnline ? (
                            <span className="text-emerald-500">Online</span>
                        ) : (
                            'Offline'
                        )}
                    </p>
                </div>
            </Link>
        </div>
    );
}
