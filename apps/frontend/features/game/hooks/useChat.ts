'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocketClient } from '@/lib/socket-client';

export type ChatMessage = {
    id: string;
    gameId: string;
    userId: string;
    username?: string;
    text: string;
    createdAt: string;
};

export function useChat(gameId: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const socket = getSocketClient();

        const handleMessage = (payload: ChatMessage) => {
            const matchesGame = String(payload.gameId) === String(gameId);
            if (!matchesGame) return;
            setMessages((prev) => [...prev, payload]);
        };

        const handleHistory = (payload: {
            gameId: string | number;
            messages: ChatMessage[];
        }) => {
            const matchesGame = String(payload.gameId) === String(gameId);
            if (!matchesGame) return;
            setMessages(payload.messages);
        };

        socket.emit('chat:join', { gameId });
        socket.on('chat:message', handleMessage);
        socket.on('chat:history', handleHistory);

        return () => {
            socket.emit('chat:leave', { gameId });
            socket.off('chat:message', handleMessage);
            socket.off('chat:history', handleHistory);
        };
    }, [gameId]);

    const sendMessage = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed) return;
            const socket = getSocketClient();
            setSending(true);
            socket.emit('chat:message', { gameId, text: trimmed }, () => {
                setSending(false);
            });
        },
        [gameId]
    );

    return { messages, sendMessage, sending };
}
