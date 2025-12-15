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
    fen: string | null | undefined,
    status: string | null | undefined
) {
    const initial: ClockState = clocks ?? { white: 0, black: 0 };
    const [display, setDisplay] = useState<ClockState>(initial);

    useEffect(() => {
        setDisplay(clocks ?? { white: 0, black: 0 });
    }, [clocks?.white, clocks?.black]);

    useEffect(() => {
        if (status !== 'active' || !fen) return;

        const parts = fen.split(' ');
        const turn = parts[1]; // 'w' or 'b'

        const interval = setInterval(() => {
            setDisplay((prev) => {
                const delta = 1000;
                return {
                    white: prev.white - (turn === 'w' ? delta : 0),
                    black: prev.black - (turn === 'b' ? delta : 0),
                };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [fen, status]);

    return {
        white: display.white,
        black: display.black,
        whiteFormatted: formatMs(display.white),
        blackFormatted: formatMs(display.black),
    };
}
