'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocketClient, getServerTime } from '@/lib/socket-client';

export interface InactivityState {
    isActive: boolean;
    activeColor: 'white' | 'black' | null;
    turnStartedAt: number | null;
    timeoutAt: number | null;
    remainingMs: number;
    warningSeconds: number | null;
    isWarning: boolean;
}

const INACTIVITY_TIMEOUT_MS = 60 * 1000;

export function useInactivityTimer(gameId: string, gameStatus: string) {
    const [state, setState] = useState<InactivityState>({
        isActive: false,
        activeColor: null,
        turnStartedAt: null,
        timeoutAt: null,
        remainingMs: INACTIVITY_TIMEOUT_MS,
        warningSeconds: null,
        isWarning: false
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Local countdown using server-synchronized time
    useEffect(() => {
        if (!state.isActive || !state.turnStartedAt || gameStatus !== 'active') {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        timerRef.current = setInterval(() => {
            setState(prev => {
                if (!prev.turnStartedAt) return prev;

                // Use server-synchronized time
                const serverNow = getServerTime();
                const elapsed = serverNow - prev.turnStartedAt;
                const remainingMs = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);

                return {
                    ...prev,
                    remainingMs,
                    isWarning: remainingMs <= 30000,
                    warningSeconds: remainingMs <= 30000 ? Math.ceil(remainingMs / 1000) : null
                };
            });
        }, 100); // Update every 100ms for smooth animation

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [state.isActive, state.turnStartedAt, gameStatus]);

    useEffect(() => {
        const socket = getSocketClient();

        const handleInactivityStart = (payload: {
            gameId: string;
            activeColor: 'white' | 'black';
            turnStartedAt: number;
            timeoutAt: number;
        }) => {
            if (payload.gameId !== gameId) return;

            setState({
                isActive: true,
                activeColor: payload.activeColor,
                turnStartedAt: payload.turnStartedAt,
                timeoutAt: payload.timeoutAt,
                remainingMs: INACTIVITY_TIMEOUT_MS,
                warningSeconds: null,
                isWarning: false
            });
        };

        const handleInactivitySync = (payload: {
            gameId: string;
            activeColor: 'white' | 'black';
            remainingMs: number;
            serverTime?: number;
        }) => {
            if (payload.gameId !== gameId) return;

            // Use server time if provided, otherwise estimate
            const serverNow = payload.serverTime ?? getServerTime();
            const turnStartedAt = serverNow - (INACTIVITY_TIMEOUT_MS - payload.remainingMs);

            setState({
                isActive: true,
                activeColor: payload.activeColor,
                turnStartedAt,
                timeoutAt: serverNow + payload.remainingMs,
                remainingMs: payload.remainingMs,
                warningSeconds: payload.remainingMs <= 30000 ? Math.ceil(payload.remainingMs / 1000) : null,
                isWarning: payload.remainingMs <= 30000
            });
        };

        const handleInactivityWarning = (payload: {
            gameId: string;
            activeColor: 'white' | 'black';
            remainingSeconds: number;
        }) => {
            if (payload.gameId !== gameId) return;

            setState(prev => ({
                ...prev,
                isWarning: true,
                warningSeconds: payload.remainingSeconds
            }));
        };

        const handleInactivityCancelled = (payload: { gameId: string }) => {
            if (payload.gameId !== gameId) return;

            setState({
                isActive: false,
                activeColor: null,
                turnStartedAt: null,
                timeoutAt: null,
                remainingMs: INACTIVITY_TIMEOUT_MS,
                warningSeconds: null,
                isWarning: false
            });
        };

        socket.on('game:inactivity-start', handleInactivityStart);
        socket.on('game:inactivity-sync', handleInactivitySync);
        socket.on('game:inactivity-warning', handleInactivityWarning);
        socket.on('game:inactivity-cancelled', handleInactivityCancelled);

        return () => {
            socket.off('game:inactivity-start', handleInactivityStart);
            socket.off('game:inactivity-sync', handleInactivitySync);
            socket.off('game:inactivity-warning', handleInactivityWarning);
            socket.off('game:inactivity-cancelled', handleInactivityCancelled);
        };
    }, [gameId]);

    // Reset when game ends
    useEffect(() => {
        if (gameStatus !== 'active') {
            setState({
                isActive: false,
                activeColor: null,
                turnStartedAt: null,
                timeoutAt: null,
                remainingMs: INACTIVITY_TIMEOUT_MS,
                warningSeconds: null,
                isWarning: false
            });
        }
    }, [gameStatus]);

    // Calculate progress percentage (0 to 1)
    const progress = state.remainingMs / INACTIVITY_TIMEOUT_MS;

    return {
        ...state,
        progress,
        INACTIVITY_TIMEOUT_MS
    };
}
