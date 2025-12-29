'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocketClient } from '@/lib/socket-client';

export interface DrawState {
    offeredBy: 'white' | 'black' | null;
    pendingResponse: boolean;
}

export function useDraw(gameId: string) {
    const [drawState, setDrawState] = useState<DrawState>({
        offeredBy: null,
        pendingResponse: false,
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const socket = getSocketClient();

        // Handle incoming draw offer
        const handleDrawOffer = (payload: { gameId: string; offeredBy: 'white' | 'black' }) => {
            if (payload.gameId !== gameId) return;
            setDrawState({
                offeredBy: payload.offeredBy,
                pendingResponse: true,
            });
        };

        // Handle draw declined
        const handleDrawDeclined = (payload: { gameId: string }) => {
            if (payload.gameId !== gameId) return;
            setDrawState({
                offeredBy: null,
                pendingResponse: false,
            });
        };

        // Handle draw cancelled (by offerer)
        const handleDrawCancelled = (payload: { gameId: string }) => {
            if (payload.gameId !== gameId) return;
            setDrawState({
                offeredBy: null,
                pendingResponse: false,
            });
        };

        socket.on('game:draw-offer', handleDrawOffer);
        socket.on('game:draw-declined', handleDrawDeclined);
        socket.on('game:draw-cancelled', handleDrawCancelled);

        return () => {
            socket.off('game:draw-offer', handleDrawOffer);
            socket.off('game:draw-declined', handleDrawDeclined);
            socket.off('game:draw-cancelled', handleDrawCancelled);
        };
    }, [gameId]);

    const offerDraw = useCallback(() => {
        const socket = getSocketClient();
        setIsLoading(true);
        socket.emit('game:draw-offer', { gameId });
        // Optimistically update local state
        setTimeout(() => setIsLoading(false), 500);
    }, [gameId]);

    const acceptDraw = useCallback(() => {
        const socket = getSocketClient();
        setIsLoading(true);
        socket.emit('game:draw-accept', { gameId });
        setTimeout(() => setIsLoading(false), 500);
    }, [gameId]);

    const declineDraw = useCallback(() => {
        const socket = getSocketClient();
        setIsLoading(true);
        socket.emit('game:draw-decline', { gameId });
        setDrawState({
            offeredBy: null,
            pendingResponse: false,
        });
        setTimeout(() => setIsLoading(false), 500);
    }, [gameId]);

    const cancelDraw = useCallback(() => {
        const socket = getSocketClient();
        socket.emit('game:draw-cancel', { gameId });
        setDrawState({
            offeredBy: null,
            pendingResponse: false,
        });
    }, [gameId]);

    return {
        drawState,
        isLoading,
        offerDraw,
        acceptDraw,
        declineDraw,
        cancelDraw,
    };
}
