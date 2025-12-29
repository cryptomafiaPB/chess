// features/game/hooks/useRematch.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocketClient } from '@/lib/socket-client';
import { useRouter } from 'next/navigation';

interface RematchState {
    isRequested: boolean;
    isOffered: boolean;
    requesterId?: string;
    expiresAt?: number;
}

export function useRematch(gameId: string | undefined) {
    const [rematchState, setRematchState] = useState<RematchState>({
        isRequested: false,
        isOffered: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!gameId) return;

        const socket = getSocketClient();

        // Listen for rematch offered by opponent
        const handleRematchOffered = (data: {
            gameId: string;
            requesterId: string;
            expiresAt: number;
        }) => {
            if (data.gameId === gameId) {
                setRematchState({
                    isRequested: false,
                    isOffered: true,
                    requesterId: data.requesterId,
                    expiresAt: data.expiresAt
                });
            }
        };

        // Listen for confirmation that we requested rematch
        const handleRematchRequested = (data: {
            gameId: string;
            requesterId: string;
            expiresAt: number;
        }) => {
            if (data.gameId === gameId) {
                setRematchState({
                    isRequested: true,
                    isOffered: false,
                    requesterId: data.requesterId,
                    expiresAt: data.expiresAt
                });
            }
        };

        // Listen for rematch accepted
        const handleRematchAccepted = (data: {
            oldGameId: string;
            newGameId: string;
        }) => {
            if (data.oldGameId === gameId) {
                // Navigate to the new game
                router.push(`/game/${data.newGameId}`);
            }
        };

        // Listen for rematch declined
        const handleRematchDeclined = (data: {
            gameId: string;
            declinerId?: string;
        }) => {
            if (data.gameId === gameId) {
                setRematchState({
                    isRequested: false,
                    isOffered: false
                });
                setError('Opponent declined the rematch');
                setTimeout(() => setError(null), 3000);
            }
        };

        // Listen for rematch cancelled
        const handleRematchCancelled = (data: { gameId: string }) => {
            if (data.gameId === gameId) {
                setRematchState({
                    isRequested: false,
                    isOffered: false
                });
                setError('Rematch request was cancelled');
                setTimeout(() => setError(null), 3000);
            }
        };

        // Listen for errors
        const handleRematchError = (data: { message: string }) => {
            setError(data.message);
            setIsLoading(false);
            setTimeout(() => setError(null), 3000);
        };

        socket.on('rematch:offered', handleRematchOffered);
        socket.on('rematch:requested', handleRematchRequested);
        socket.on('rematch:accepted', handleRematchAccepted);
        socket.on('rematch:declined', handleRematchDeclined);
        socket.on('rematch:cancelled', handleRematchCancelled);
        socket.on('rematch:error', handleRematchError);

        return () => {
            socket.off('rematch:offered', handleRematchOffered);
            socket.off('rematch:requested', handleRematchRequested);
            socket.off('rematch:accepted', handleRematchAccepted);
            socket.off('rematch:declined', handleRematchDeclined);
            socket.off('rematch:cancelled', handleRematchCancelled);
            socket.off('rematch:error', handleRematchError);
        };
    }, [gameId, router]);

    const requestRematch = useCallback(() => {
        if (!gameId) return;

        setIsLoading(true);
        setError(null);

        const socket = getSocketClient();
        socket.emit('rematch:request', { gameId });

        // Loading will be cleared by the response handler
        setTimeout(() => setIsLoading(false), 1000);
    }, [gameId]);

    const acceptRematch = useCallback(() => {
        if (!gameId) return;

        setIsLoading(true);
        setError(null);

        const socket = getSocketClient();
        socket.emit('rematch:accept', { gameId });

        setTimeout(() => setIsLoading(false), 1000);
    }, [gameId]);

    const declineRematch = useCallback(() => {
        if (!gameId) return;

        setIsLoading(true);
        setError(null);

        const socket = getSocketClient();
        socket.emit('rematch:decline', { gameId });

        setTimeout(() => setIsLoading(false), 500);
    }, [gameId]);

    const cancelRematch = useCallback(() => {
        if (!gameId) return;

        setIsLoading(true);
        setError(null);

        const socket = getSocketClient();
        socket.emit('rematch:cancel', { gameId });

        setTimeout(() => setIsLoading(false), 500);
    }, [gameId]);

    return {
        rematchState,
        requestRematch,
        acceptRematch,
        declineRematch,
        cancelRematch,
        isLoading,
        error
    };
}
