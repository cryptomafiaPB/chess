"use client";

import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '@/features/game/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    sending: boolean;
    myUserId?: string;
};

function ChatPanelInner({ messages, onSend, sending, myUserId }: Props) {
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement | null>(null);

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
        <div className="flex h-64 flex-col rounded-md border bg-card p-2">
            <div className="flex-1 space-y-1 overflow-y-auto p-2 text-xs">
                {messages.map((m) => {
                    const isMe = m.userId === myUserId;
                    return (
                        <div
                            key={m.id}
                            className={
                                'flex ' + (isMe ? 'justify-end' : 'justify-start')
                            }
                        >
                            <div
                                className={
                                    'max-w-[80%] rounded px-2 py-1 ' +
                                    (isMe
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground')
                                }
                            >
                                {!isMe && (
                                    <div className="mb-0.5 text-[10px] font-semibold text-muted-foreground">
                                        {m.username ?? m.userId}
                                    </div>
                                )}
                                <div>{m.text}</div>
                                <div className="mt-0.5 text-[9px] text-muted-foreground">
                                    {new Date(m.createdAt).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
            <form
                onSubmit={handleSubmit}
                className="flex gap-1 border-t p-2"
            >
                <Input
                    className="h-8 text-xs"
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <Button
                    type="submit"
                    size="sm"
                    className="h-8"
                    disabled={sending}
                >
                    Send
                </Button>
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
