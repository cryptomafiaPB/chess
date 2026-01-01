'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSocketClient, isSocketConnected, waitForConnection } from '@/lib/socket-client';

export type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical';

export interface Challenge {
    challengeId: string;
    challengerId: string;
    challengedId?: string;
    timeControl: TimeControl;
    expiresAt: number;
}

export interface IncomingChallenge extends Challenge {
    challengerUsername?: string;
}

export function useChallenge() {
    const router = useRouter();
    const [outgoingChallenge, setOutgoingChallenge] = useState<Challenge | null>(null);
    const [incomingChallenges, setIncomingChallenges] = useState<IncomingChallenge[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const socket = getSocketClient();

        // Challenge sent confirmation
        const handleSent = (payload: Challenge) => {
            console.log('Challenge sent:', payload);
            setOutgoingChallenge(payload);
            setIsSending(false);
            setError(null);
        };

        // Received a challenge from someone
        const handleReceived = (payload: IncomingChallenge) => {
            console.log('Challenge received:', payload);
            setIncomingChallenges(prev => {
                // Avoid duplicates
                if (prev.some(c => c.challengeId === payload.challengeId)) {
                    return prev;
                }
                return [...prev, payload];
            });
        };

        // Challenge accepted - navigate to game
        const handleAccepted = (payload: { challengeId: string; gameId: string }) => {
            console.log('Challenge accepted, navigating to game:', payload.gameId);
            setOutgoingChallenge(null);
            setIncomingChallenges(prev => prev.filter(c => c.challengeId !== payload.challengeId));
            router.push(`/game/${payload.gameId}`);
        };

        // Challenge declined
        const handleDeclined = (payload: { challengeId: string; declinedBy: string }) => {
            console.log('Challenge declined:', payload);
            setOutgoingChallenge(null);
            setIncomingChallenges(prev => prev.filter(c => c.challengeId !== payload.challengeId));
        };

        // Challenge cancelled
        const handleCancelled = (payload: { challengeId: string; cancelledBy?: string }) => {
            console.log('Challenge cancelled:', payload);
            setOutgoingChallenge(null);
            setIncomingChallenges(prev => prev.filter(c => c.challengeId !== payload.challengeId));
        };

        // Error handling
        const handleError = (payload: { message: string }) => {
            console.error('Challenge error:', payload.message);
            setError(payload.message);
            setIsSending(false);
        };

        socket.on('challenge:sent', handleSent);
        socket.on('challenge:received', handleReceived);
        socket.on('challenge:accepted', handleAccepted);
        socket.on('challenge:declined', handleDeclined);
        socket.on('challenge:cancelled', handleCancelled);
        socket.on('challenge:error', handleError);

        return () => {
            socket.off('challenge:sent', handleSent);
            socket.off('challenge:received', handleReceived);
            socket.off('challenge:accepted', handleAccepted);
            socket.off('challenge:declined', handleDeclined);
            socket.off('challenge:cancelled', handleCancelled);
            socket.off('challenge:error', handleError);
        };
    }, [router]);

    // Clean up expired challenges
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();

            // Remove expired outgoing challenge
            if (outgoingChallenge && now > outgoingChallenge.expiresAt) {
                setOutgoingChallenge(null);
            }

            // Remove expired incoming challenges
            setIncomingChallenges(prev => prev.filter(c => now < c.expiresAt));
        }, 1000);

        return () => clearInterval(interval);
    }, [outgoingChallenge]);

    const sendChallenge = useCallback(async (challengedId: string, timeControl: TimeControl) => {
        setError(null);
        setIsSending(true);

        if (!isSocketConnected()) {
            try {
                await waitForConnection(5000);
            } catch {
                setError('Unable to connect to server');
                setIsSending(false);
                return;
            }
        }

        const socket = getSocketClient();
        socket.emit('challenge:send', { challengedId, timeControl });
    }, []);

    const acceptChallenge = useCallback(async (challengeId: string) => {
        if (!isSocketConnected()) {
            try {
                await waitForConnection(5000);
            } catch {
                setError('Unable to connect to server');
                return;
            }
        }

        const socket = getSocketClient();
        socket.emit('challenge:accept', { challengeId });
    }, []);

    const declineChallenge = useCallback(async (challengeId: string) => {
        if (!isSocketConnected()) {
            try {
                await waitForConnection(5000);
            } catch {
                setError('Unable to connect to server');
                return;
            }
        }

        const socket = getSocketClient();
        socket.emit('challenge:decline', { challengeId });
        setIncomingChallenges(prev => prev.filter(c => c.challengeId !== challengeId));
    }, []);

    const cancelChallenge = useCallback(async () => {
        if (!outgoingChallenge) return;

        if (!isSocketConnected()) {
            try {
                await waitForConnection(5000);
            } catch {
                setError('Unable to connect to server');
                return;
            }
        }

        const socket = getSocketClient();
        socket.emit('challenge:cancel', { challengeId: outgoingChallenge.challengeId });
        setOutgoingChallenge(null);
    }, [outgoingChallenge]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        outgoingChallenge,
        incomingChallenges,
        error,
        isSending,
        sendChallenge,
        acceptChallenge,
        declineChallenge,
        cancelChallenge,
        clearError,
    };
}
