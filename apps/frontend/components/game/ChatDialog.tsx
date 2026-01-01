'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '@/features/game/hooks/useChat';
import { cn } from '@/lib/utils';
import { MessageCircle, Send, X } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSend: (text: string) => void;
    sending: boolean;
    myUserId?: string;
}

export function ChatDialog({ isOpen, onClose, messages, onSend, sending, myUserId }: Props) {
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            // Focus input when dialog opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, messages.length]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || sending) return;
        onSend(text);
        setText('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-lg bg-card rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh] animate-in slide-in-from-bottom duration-300 border-t border-x border-border/50">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Chat</h3>
                        {messages.length > 0 && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-full">
                                {messages.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                            <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
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
                                            'max-w-[80%] rounded-2xl px-4 py-2.5',
                                            isMe
                                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                                : 'bg-muted text-foreground rounded-bl-sm'
                                        )}
                                    >
                                        {!isMe && (
                                            <div className="text-[11px] font-semibold text-muted-foreground mb-0.5">
                                                {m.username ?? m.userId}
                                            </div>
                                        )}
                                        <div className="text-sm">{m.text}</div>
                                        <div className={cn(
                                            'text-[10px] mt-1',
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
                <form onSubmit={handleSubmit} className="p-3 border-t border-border/50">
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 border border-border/50">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type a message..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm"
                        />
                        <button
                            type="submit"
                            disabled={sending || !text.trim()}
                            className={cn(
                                'p-2 rounded-xl transition-all',
                                text.trim() && !sending
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                            )}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
