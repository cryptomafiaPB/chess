"use client";

import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '@/features/game/hooks/useChat';

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
        <div className={`flex flex-col bg-slate-800/50 rounded-xl overflow-hidden ${compact ? 'h-48' : 'h-full'}`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/50">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium text-slate-300">Chat</span>
                {messages.length > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-sky-500/20 text-sky-400 rounded-full">
                        {messages.length}
                    </span>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs py-4">
                        <svg className="w-6 h-6 mb-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>No messages yet</span>
                    </div>
                ) : (
                    messages.map((m) => {
                        const isMe = m.userId === myUserId;
                        return (
                            <div
                                key={m.id}
                                className={'flex ' + (isMe ? 'justify-end' : 'justify-start')}
                            >
                                <div
                                    className={`
                                        max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs
                                        ${isMe
                                            ? 'bg-sky-500 text-white rounded-br-sm'
                                            : 'bg-slate-700 text-slate-100 rounded-bl-sm'}
                                    `}
                                >
                                    {!isMe && (
                                        <div className="text-[10px] font-semibold text-slate-400 mb-0.5">
                                            {m.username ?? m.userId}
                                        </div>
                                    )}
                                    <div>{m.text}</div>
                                    <div className={`text-[9px] mt-0.5 ${isMe ? 'text-sky-200' : 'text-slate-500'}`}>
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
                className="flex gap-2 p-2 border-t border-slate-700/50"
            >
                <input
                    ref={inputRef}
                    type="text"
                    className="flex-1 h-8 px-3 text-xs bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50"
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className="px-3 h-8 text-xs font-medium bg-sky-500 hover:bg-sky-600 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
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
