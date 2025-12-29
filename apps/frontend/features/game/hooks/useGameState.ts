'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocketClient } from '@/lib/socket-client';

export type GameRole = 'white' | 'black' | 'spectator';

export type PresenceStatus = 'online' | 'offline';

export interface ClockState {
    white: number;
    black: number;
    increment?: number;
    lastMoveAt?: number;
    activeColor?: 'white' | 'black';
}

// Dynamic game state - changes during gameplay
export interface GameState {
    gameId: string;
    fen: string;
    role: GameRole;
    status: 'waiting' | 'active' | 'completed' | 'aborted';
    result?: string | null;
    resultReason?: string | null;
    clocks: ClockState;
    lastMove?: { from: string; to: string; promotion?: string | null } | null;
    presence: {
        white: PresenceStatus;
        black: PresenceStatus;
    };
}

export function useGameState(gameId: string) {
    const [state, setState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const socket = getSocketClient();
        setLoading(true);
        setError(null);

        const handleState = (payload: any) => {
            const next: GameState = {
                gameId: payload.gameId,
                fen: payload.fen,
                role: payload.role,
                status: payload.status,
                result: payload.result,
                resultReason: payload.resultReason,
                clocks: {
                    white: payload.clocks?.white ?? 0,
                    black: payload.clocks?.black ?? 0,
                    increment: payload.clocks?.increment,
                    lastMoveAt: payload.clocks?.lastMoveAt,
                    activeColor: payload.clocks?.activeColor,
                },
                lastMove: payload.move ?? null,
                presence: {
                    white: payload.presence?.white ?? 'online',
                    black: payload.presence?.black ?? 'online',
                },
            };
            setState(next);
            setLoading(false);
        };

        const handleMove = (payload: any) => {
            setState((prev) => {
                if (!prev || prev.gameId !== payload.gameId) return prev;
                return {
                    ...prev,
                    fen: payload.fen,
                    status: payload.gameOver ? 'completed' : prev.status,
                    result: payload.result ?? prev.result,
                    resultReason: payload.resultReason ?? prev.resultReason,
                    lastMove: payload.move ?? prev.lastMove ?? null,
                    clocks: {
                        white: payload.clocks?.white ?? prev.clocks.white,
                        black: payload.clocks?.black ?? prev.clocks.black,
                        increment: payload.clocks?.increment ?? prev.clocks.increment,
                        lastMoveAt: payload.clocks?.lastMoveAt ?? prev.clocks.lastMoveAt,
                        activeColor: payload.clocks?.activeColor ?? prev.clocks.activeColor,
                    },
                };
            });
        };

        const handleEnded = (payload: any) => {
            setState((prev) => {
                if (!prev || prev.gameId !== payload.gameId) return prev;
                return {
                    ...prev,
                    status: 'completed',
                    result: payload.result,
                    resultReason: payload.resultReason,
                };
            });
        };

        const handlePresence = (payload: {
            gameId: string;
            userId: string;
            role: 'white' | 'black';
            status: PresenceStatus;
        }) => {
            if (payload.gameId !== gameId) return;
            setState((prev) => {
                if (!prev) return prev;
                const presence = { ...prev.presence };
                presence[payload.role] = payload.status;
                return { ...prev, presence };
            });
        };

        const handleError = (payload: any) => {
            setError(payload.message ?? 'Game error');
        };

        socket.emit('game:join', { gameId });

        socket.on('game:state', handleState);
        socket.on('game:move', handleMove);
        socket.on('game:ended', handleEnded);
        socket.on('game:presence', handlePresence);
        socket.on('game:error', handleError);
        socket.on('game:invalid-move', handleError);

        return () => {
            socket.off('game:state', handleState);
            socket.off('game:move', handleMove);
            socket.off('game:ended', handleEnded);
            socket.off('game:presence', handlePresence);
            socket.off('game:error', handleError);
            socket.off('game:invalid-move', handleError);
        };
    }, [gameId]);

    const sendMove = useCallback(
        (from: string, to: string, promotion?: string) => {
            const socket = getSocketClient();
            socket.emit('game:move', { gameId, from, to, promotion });
        },
        [gameId]
    );

    const resign = useCallback(() => {
        const socket = getSocketClient();
        socket.emit('game:resign', { gameId });
    }, [gameId]);

    return {
        state,
        loading,
        error,
        sendMove,
        resign,
    };
}
