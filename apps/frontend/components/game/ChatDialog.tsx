'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '@/features/game/hooks/useChat';

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
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-lg bg-slate-900 rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh] animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                    <h3 className="font-semibold text-white">Chat</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm">
                            <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            No messages yet
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
                                            max-w-[80%] rounded-2xl px-4 py-2
                                            ${isMe
                                                ? 'bg-sky-500 text-white rounded-br-sm'
                                                : 'bg-slate-700 text-slate-100 rounded-bl-sm'}
                                        `}
                                    >
                                        {!isMe && (
                                            <div className="text-[11px] font-semibold text-slate-400 mb-0.5">
                                                {m.username ?? m.userId}
                                            </div>
                                        )}
                                        <div className="text-sm">{m.text}</div>
                                        <div className={`text-[10px] mt-1 ${isMe ? 'text-sky-200' : 'text-slate-500'}`}>
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
                <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700">
                    <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type a message..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                        />
                        <button
                            type="submit"
                            disabled={sending || !text.trim()}
                            className={`
                                p-2 rounded-lg transition-colors
                                ${text.trim() && !sending
                                    ? 'bg-sky-500 text-white hover:bg-sky-600'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                            `}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
