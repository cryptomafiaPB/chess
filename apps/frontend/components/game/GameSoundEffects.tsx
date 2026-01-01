'use client';

import { useEffect, useRef } from 'react';
import { useGameSounds } from '@/features/game/hooks/useSound';
import { getSocketClient } from '@/lib/socket-client';

interface GameSoundEffectsProps {
    gameId: string;
    isActive: boolean;
    myUserId?: number | string; // Used to skip playing sounds for our own moves (already played immediately)
}

/**
 * Component that listens for game events and plays appropriate sounds.
 * Own moves are played immediately in the game page; this handles opponent moves and game events.
 */
export function GameSoundEffects({ gameId, isActive, myUserId }: GameSoundEffectsProps) {
    const { playMove, playGameStart, playGameEnd, playLowTime, playDraw, playNotify } = useGameSounds();
    const hasPlayedStartRef = useRef(false);
    const lowTimePlayedRef = useRef({ white: false, black: false });

    useEffect(() => {
        if (!isActive) return;

        const socket = getSocketClient();

        // Play game start sound once
        if (!hasPlayedStartRef.current) {
            playGameStart();
            hasPlayedStartRef.current = true;
        }

        // Listen for moves (only play for opponent moves - our moves are played immediately)
        const handleMove = (payload: any) => {
            if (payload.gameId !== gameId) return;

            // Skip if this is our own move (we already played the sound immediately)
            if (myUserId && payload.playerId && String(payload.playerId) === String(myUserId)) {
                return;
            }

            const move = payload.move;
            const isCheck = payload.isCheck;
            const isCheckmate = payload.result === 'checkmate';
            const isCapture = move?.san?.includes('x');
            const isCastle = move?.san === 'O-O' || move?.san === 'O-O-O';
            const isPromotion = move?.promotion;

            playMove({
                isCapture,
                isCheck,
                isCheckmate,
                isCastle,
                isPromotion,
            });

            // Check for game over
            if (payload.gameOver) {
                if (payload.result === 'draw') {
                    setTimeout(() => playDraw(), 500);
                } else if (!isCheckmate) {
                    setTimeout(() => playGameEnd(), 500);
                }
            }
        };

        // Listen for game over events
        const handleGameOver = (payload: any) => {
            if (payload.gameId !== gameId) return;

            if (payload.result === 'draw') {
                playDraw();
            } else {
                playGameEnd();
            }
        };

        // Listen for draw offers
        const handleDrawOffer = (payload: any) => {
            if (payload.gameId !== gameId) return;
            playNotify();
        };

        socket.on('game:move', handleMove);
        socket.on('game:over', handleGameOver);
        socket.on('game:draw-offered', handleDrawOffer);

        return () => {
            socket.off('game:move', handleMove);
            socket.off('game:over', handleGameOver);
            socket.off('game:draw-offered', handleDrawOffer);
        };
    }, [gameId, isActive, playMove, playGameStart, playGameEnd, playDraw, playNotify]);

    // Low time warning sounds
    useEffect(() => {
        if (!isActive) return;

        const socket = getSocketClient();

        const handleClock = (payload: any) => {
            if (payload.gameId !== gameId) return;

            const { white, black, activeColor } = payload;

            // Play low time warning when under 30 seconds
            if (activeColor === 'white' && white < 30000 && !lowTimePlayedRef.current.white) {
                playLowTime();
                lowTimePlayedRef.current.white = true;
            }
            if (activeColor === 'black' && black < 30000 && !lowTimePlayedRef.current.black) {
                playLowTime();
                lowTimePlayedRef.current.black = true;
            }

            // Reset low time flag if time goes back up (e.g., increment)
            if (white >= 30000) lowTimePlayedRef.current.white = false;
            if (black >= 30000) lowTimePlayedRef.current.black = false;
        };

        socket.on('game:clock', handleClock);

        return () => {
            socket.off('game:clock', handleClock);
        };
    }, [gameId, isActive, playLowTime]);

    return null; // This component doesn't render anything
}
