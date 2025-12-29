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
const WARNING_THRESHOLD_MS = 30 * 1000;

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
    // Epoch counter to invalidate stale interval updates
    const epochRef = useRef<number>(0);

    // Local countdown using server-synchronized time
    useEffect(() => {
        if (!state.isActive || !state.turnStartedAt || gameStatus !== 'active') {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        // Capture the current epoch - if it changes, this interval is stale
        const currentEpoch = epochRef.current;
        const startedAt = state.turnStartedAt;

        timerRef.current = setInterval(() => {
            // If epoch changed, this interval is stale - do nothing
            if (epochRef.current !== currentEpoch) {
                return;
            }

            // Use server-synchronized time
            const serverNow = getServerTime();
            const elapsed = serverNow - startedAt;
            const remainingMs = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);
            const isWarning = remainingMs <= WARNING_THRESHOLD_MS;

            setState(prev => {
                // Double-check epoch hasn't changed
                if (epochRef.current !== currentEpoch) return prev;

                return {
                    ...prev,
                    remainingMs,
                    isWarning,
                    warningSeconds: isWarning ? Math.ceil(remainingMs / 1000) : null
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
            serverTime?: number;
        }) => {
            if (payload.gameId !== gameId) return;

            // Increment epoch to invalidate any running interval
            epochRef.current++;

            // Use the server's turnStartedAt directly - this is the source of truth
            // Calculate remaining time based on server time if provided
            const serverNow = payload.serverTime ?? getServerTime();
            const elapsed = Math.max(0, serverNow - payload.turnStartedAt);
            const remainingMs = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);

            console.log('[Inactivity] Start timer for', payload.activeColor,
                'turnStartedAt:', payload.turnStartedAt,
                'remaining:', remainingMs, 'ms');

            setState({
                isActive: true,
                activeColor: payload.activeColor,
                turnStartedAt: payload.turnStartedAt,
                timeoutAt: payload.timeoutAt,
                remainingMs,
                warningSeconds: remainingMs <= WARNING_THRESHOLD_MS ? Math.ceil(remainingMs / 1000) : null,
                isWarning: remainingMs <= WARNING_THRESHOLD_MS
            });
        };

        const handleInactivitySync = (payload: {
            gameId: string;
            activeColor: 'white' | 'black';
            remainingMs: number;
            serverTime?: number;
        }) => {
            if (payload.gameId !== gameId) return;

            // Increment epoch to invalidate any running interval
            epochRef.current++;

            // Use server time if provided, otherwise estimate
            const serverNow = payload.serverTime ?? getServerTime();
            const turnStartedAt = serverNow - (INACTIVITY_TIMEOUT_MS - payload.remainingMs);
            const isWarning = payload.remainingMs <= WARNING_THRESHOLD_MS;

            console.log('[Inactivity] Sync for', payload.activeColor,
                'remaining:', payload.remainingMs, 'ms');

            setState({
                isActive: true,
                activeColor: payload.activeColor,
                turnStartedAt,
                timeoutAt: serverNow + payload.remainingMs,
                remainingMs: payload.remainingMs,
                warningSeconds: isWarning ? Math.ceil(payload.remainingMs / 1000) : null,
                isWarning
            });
        };

        const handleInactivityWarning = (payload: {
            gameId: string;
            activeColor: 'white' | 'black';
            remainingSeconds: number;
        }) => {
            if (payload.gameId !== gameId) return;

            // Only update if the warning is for the current active player
            // This prevents stale warnings from a previous turn affecting the current state
            setState(prev => {
                // Ignore if timer is not active or warning is for different color
                if (!prev.isActive || prev.activeColor !== payload.activeColor) {
                    console.log('[Inactivity] Ignoring stale warning for', payload.activeColor,
                        'current active:', prev.activeColor);
                    return prev;
                }

                return {
                    ...prev,
                    isWarning: true,
                    warningSeconds: payload.remainingSeconds
                };
            });
        };

        const handleInactivityCancelled = (payload: { gameId: string }) => {
            if (payload.gameId !== gameId) return;

            // Increment epoch to invalidate any running interval
            epochRef.current++;

            console.log('[Inactivity] Timer cancelled');

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
