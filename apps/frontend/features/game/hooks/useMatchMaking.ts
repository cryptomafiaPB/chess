'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSocketClient, waitForConnection, isSocketConnected } from '@/lib/socket-client';

export type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical';

export function useMatchmaking() {
    const router = useRouter();
    const [isQueueing, setIsQueueing] = useState(false);
    const [timeControl, setTimeControl] = useState<TimeControl>('blitz');
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

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
        async (tc: TimeControl) => {
            setError(null);
            setTimeControl(tc);

            // Ensure socket is connected before emitting
            if (!isSocketConnected()) {
                setIsConnecting(true);
                try {
                    await waitForConnection(5000);
                } catch (err) {
                    setError('Unable to connect to server. Please try again.');
                    setIsConnecting(false);
                    return;
                }
                setIsConnecting(false);
            }

            const socket = getSocketClient();
            setIsQueueing(true);
            socket.emit('queue:join', { timeControl: tc });
        },
        []
    );

    const leaveQueue = useCallback(() => {
        const socket = getSocketClient();
        setIsQueueing(false);
        if (isSocketConnected()) {
            socket.emit('queue:leave', { timeControl });
        }
    }, [timeControl]);

    return {
        isQueueing,
        isConnecting,
        timeControl,
        error,
        joinQueue,
        leaveQueue,
        setTimeControl,
    };
}
