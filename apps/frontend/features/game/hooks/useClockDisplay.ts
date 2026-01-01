// src/features/game/hooks/useClockDisplay.ts
'use client';

import { useEffect, useState, useRef } from 'react';
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

    // Track epoch to invalidate stale effects
    const epochRef = useRef(0);

    // Keep display in sync when server clocks change - immediate update
    useEffect(() => {
        epochRef.current++;

        if (!clocks) {
            setDisplay({ white: 0, black: 0 });
            return;
        }

        // Immediately update display with new clock values
        setDisplay({
            white: clocks.white,
            black: clocks.black,
            increment: clocks.increment,
            lastMoveAt: clocks.lastMoveAt,
            activeColor: clocks.activeColor,
        });
    }, [clocks?.white, clocks?.black, clocks?.lastMoveAt, clocks?.activeColor, clocks?.increment]);

    // Client-side ticking using server-synchronized time to reduce drift
    useEffect(() => {
        // Don't tick if game isn't active
        if (status !== 'active') return;
        if (!clocks || !clocks.activeColor) return;
        // If lastMoveAt is 0 or undefined, clock hasn't started yet
        if (!clocks.lastMoveAt || clocks.lastMoveAt === 0) return;

        // Capture current epoch to detect if we should stop
        const currentEpoch = epochRef.current;

        // Capture current values for this tick cycle
        const baseWhite = clocks.white;
        const baseBlack = clocks.black;
        const { activeColor, lastMoveAt, increment } = clocks;

        let rafId: number;

        const tick = () => {
            // Stop if epoch changed (new clock values arrived)
            if (epochRef.current !== currentEpoch) return;

            // Use synchronized server time
            const serverNow = getServerTime();
            const elapsed = Math.max(0, serverNow - lastMoveAt);

            const next: ClockState = {
                white: activeColor === 'white' ? Math.max(0, baseWhite - elapsed) : baseWhite,
                black: activeColor === 'black' ? Math.max(0, baseBlack - elapsed) : baseBlack,
                increment,
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
