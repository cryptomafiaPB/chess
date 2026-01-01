"use client";

import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '@/features/game/hooks/useChat';
import { cn } from '@/lib/utils';
import { MessageCircle, Send } from 'lucide-react';

type Props = {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    sending: boolean;
    myUserId?: string;
    compact?: boolean;
};

function ChatPanelInner({ messages, onSend, sending, myUserId, compact = false }: Props) {
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || sending) return;
        onSend(text);
        setText('');
    };

    return (
        <div className={cn(
            'flex flex-col bg-card/50 rounded-xl overflow-hidden border border-border/30',
            compact ? 'h-48' : 'h-full'
        )}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 bg-card/30">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Chat</span>
                {messages.length > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-full">
                        {messages.length}
                    </span>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs py-4">
                        <MessageCircle className="w-6 h-6 mb-1.5 opacity-50" />
                        <span>No messages yet</span>
                    </div>
                ) : (
                    messages.map((m) => {
                        const isMe = m.userId === myUserId;
                        return (
                            <div
                                key={m.id}
                                className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
                            >
                                <div
                                    className={cn(
                                        'max-w-[85%] rounded-2xl px-3 py-2 text-xs',
                                        isMe
                                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                                            : 'bg-muted text-foreground rounded-bl-sm'
                                    )}
                                >
                                    {!isMe && (
                                        <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                                            {m.username ?? m.userId}
                                        </div>
                                    )}
                                    <div>{m.text}</div>
                                    <div className={cn(
                                        'text-[9px] mt-1',
                                        isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                    )}>
                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
                onSubmit={handleSubmit}
                className="flex gap-2 p-2.5 border-t border-border/30 bg-card/30"
            >
                <input
                    ref={inputRef}
                    type="text"
                    className={cn(
                        'flex-1 h-9 px-3 text-xs rounded-xl transition-all',
                        'bg-muted/50 border border-border/50',
                        'text-foreground placeholder-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50'
                    )}
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className={cn(
                        'px-3 h-9 rounded-xl transition-all',
                        'bg-primary hover:bg-primary/90 text-primary-foreground',
                        'disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
                        'flex items-center justify-center'
                    )}
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}

function areEqual(prev: Props, next: Props) {
    if (prev.sending !== next.sending) return false;
    if (prev.myUserId !== next.myUserId) return false;
    if (prev.messages.length !== next.messages.length) return false;
    const prevLast = prev.messages[prev.messages.length - 1];
    const nextLast = next.messages[next.messages.length - 1];
    if (!prevLast && !nextLast) return true;
    if (!prevLast || !nextLast) return false;
    return prevLast.id === nextLast.id;
}

export const ChatPanel = React.memo(ChatPanelInner, areEqual);
