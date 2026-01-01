'use client';

import { useState, useEffect } from 'react';
import { getSocketClient, isSocketConnected, waitForConnection } from '@/lib/socket-client';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Hook to track socket connection status.
 * Useful for showing connection indicators and preventing actions when disconnected.
 */
export function useSocketConnection() {
    const [status, setStatus] = useState<ConnectionStatus>(() =>
        isSocketConnected() ? 'connected' : 'connecting'
    );
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const socket = getSocketClient();

        const handleConnect = () => {
            console.log('useSocketConnection: connected');
            setStatus('connected');
            setError(null);
        };

        const handleDisconnect = (reason: string) => {
            console.log('useSocketConnection: disconnected', reason);
            setStatus('disconnected');
        };

        const handleConnectError = (err: Error) => {
            console.log('useSocketConnection: error', err.message);
            setStatus('error');
            setError(err.message);
        };

        const handleReconnecting = () => {
            setStatus('connecting');
        };

        // Set initial status
        if (socket.connected) {
            setStatus('connected');
        } else {
            setStatus('connecting');
        }

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('reconnect_attempt', handleReconnecting);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off('reconnect_attempt', handleReconnecting);
        };
    }, []);

    return {
        status,
        isConnected: status === 'connected',
        isConnecting: status === 'connecting',
        error,
        waitForConnection,
    };
}
