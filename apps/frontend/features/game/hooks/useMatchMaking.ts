'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSocketClient } from '@/lib/socket-client';

export type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical';

export function useMatchmaking() {
    const router = useRouter();
    const [isQueueing, setIsQueueing] = useState(false);
    const [timeControl, setTimeControl] = useState<TimeControl>('blitz');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const socket = getSocketClient();

        const handleStarted = (payload: {
            gameId: string;
            whitePlayerId: string;
            blackPlayerId: string;
            timeControl: TimeControl;
        }) => {
            setIsQueueing(false);
            router.push(`/game/${payload.gameId}`);
        };

        const handleQueueError = (payload: { message: string }) => {
            setIsQueueing(false);
            setError(payload.message);
        };

        socket.on('game:started', handleStarted);
        socket.on('queue:error', handleQueueError);

        return () => {
            socket.off('game:started', handleStarted);
            socket.off('queue:error', handleQueueError);
        };
    }, [router]);

    const joinQueue = useCallback(
        (tc: TimeControl) => {
            const socket = getSocketClient();
            setError(null);
            setIsQueueing(true);
            setTimeControl(tc);
            socket.emit('queue:join', { timeControl: tc });
        },
        []
    );

    const leaveQueue = useCallback(() => {
        const socket = getSocketClient();
        setIsQueueing(false);
        socket.emit('queue:leave', { timeControl });
    }, [timeControl]);

    return {
        isQueueing,
        timeControl,
        error,
        joinQueue,
        leaveQueue,
        setTimeControl,
    };
}
