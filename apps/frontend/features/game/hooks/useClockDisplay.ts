// src/features/game/hooks/useClockDisplay.ts
'use client';

import { useEffect, useState } from 'react';
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

    // Client-side ticking using lastMoveAt and activeColor to reduce drift
    useEffect(() => {
        if (status !== 'active') return;
        if (!clocks || !clocks.activeColor || !clocks.lastMoveAt) return;

        let rafId: number;
        const baseWhite = clocks.white;
        const baseBlack = clocks.black;
        const { activeColor, lastMoveAt } = clocks;

        const tick = () => {
            const now = Date.now();
            const elapsed = Math.max(0, now - lastMoveAt);

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
