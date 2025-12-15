'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSocketClient } from '@/lib/socket-client';

type HintMove = {
    from: string;
    to: string;
    san: string;
    promotion?: string;
};

export function useMoveHints(gameId: string) {
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [moves, setMoves] = useState<HintMove[]>([]);

    useEffect(() => {
        const socket = getSocketClient();

        const handleHints = (payload: {
            gameId: string;
            from?: string;
            moves: HintMove[];
        }) => {
            if (payload.gameId !== gameId) return;
            setMoves(payload.moves);
        };

        socket.on('game:hints', handleHints);

        return () => {
            socket.off('game:hints', handleHints);
        };
    }, [gameId]);

    const requestHints = useCallback(
        (from: string) => {
            const socket = getSocketClient();
            setSelectedSquare(from);
            setMoves([]);
            socket.emit('game:hints', { gameId, from });
        },
        [gameId]
    );

    const clearHints = useCallback(() => {
        setSelectedSquare(null);
        setMoves([]);
    }, []);

    const highlightedSquares = moves.map((m) => m.to);

    return {
        selectedSquare,
        moves,
        highlightedSquares,
        requestHints,
        clearHints,
        setSelectedSquare,
    };
}
