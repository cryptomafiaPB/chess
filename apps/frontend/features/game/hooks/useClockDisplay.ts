// src/features/game/hooks/useClockDisplay.ts
'use client';

import { useEffect, useState } from 'react';
import { getServerTime } from '@/lib/socket-client';
import type { ClockState } from './useGameState';

function formatMs(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
}

export function useClockDisplay(
    clocks: ClockState | null | undefined,
    status: string | null | undefined
) {
    const initial: ClockState = clocks ?? { white: 0, black: 0 };
    const [display, setDisplay] = useState<ClockState>(initial);

    // Keep display in sync when server clocks change
    useEffect(() => {
        setDisplay(clocks ?? { white: 0, black: 0 });
    }, [clocks?.white, clocks?.black, clocks?.lastMoveAt, clocks?.activeColor]);

    // Client-side ticking using server-synchronized time to reduce drift
    useEffect(() => {
        // Don't tick if game isn't active or waiting to start
        if (status !== 'active') return;
        if (!clocks || !clocks.activeColor) return;
        // If lastMoveAt is 0, clock hasn't started yet (waiting for both players)
        if (!clocks.lastMoveAt || clocks.lastMoveAt === 0) return;

        let rafId: number;
        const baseWhite = clocks.white;
        const baseBlack = clocks.black;
        const { activeColor, lastMoveAt } = clocks;

        const tick = () => {
            // Use synchronized server time instead of local Date.now()
            const serverNow = getServerTime();
            const elapsed = Math.max(0, serverNow - lastMoveAt);

            const next: ClockState = {
                white: activeColor === 'white' ? baseWhite - elapsed : baseWhite,
                black: activeColor === 'black' ? baseBlack - elapsed : baseBlack,
                increment: clocks.increment,
                lastMoveAt,
                activeColor,
            };

            setDisplay(next);
            rafId = window.requestAnimationFrame(tick);
        };

        rafId = window.requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [clocks?.white, clocks?.black, clocks?.activeColor, clocks?.lastMoveAt, clocks?.increment, status]);

    return {
        white: display.white,
        black: display.black,
        whiteFormatted: formatMs(display.white),
        blackFormatted: formatMs(display.black),
    };
}
