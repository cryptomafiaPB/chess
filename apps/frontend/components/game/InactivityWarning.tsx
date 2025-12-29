'use client';

import React from 'react';
import type { InactivityState } from '@/features/game/hooks/useInactivityTimer';

interface Props {
    inactivity: InactivityState & { progress: number };
    isMyTurn: boolean;
    playerColor: 'white' | 'black' | null;
}

export function InactivityWarning({ inactivity, isMyTurn, playerColor }: Props) {
    // Only show warning if:
    // 1. Inactivity tracking is active
    // 2. Warning is triggered (< 30 seconds)
    // 3. It's the current player's turn
    const showWarning =
        inactivity.isActive &&
        inactivity.isWarning &&
        inactivity.activeColor === playerColor &&
        isMyTurn;

    if (!showWarning) return null;

    const remainingSeconds = inactivity.warningSeconds ?? Math.ceil(inactivity.remainingMs / 1000);
    const isUrgent = remainingSeconds <= 10;
    const isCritical = remainingSeconds <= 5;

    return (
        <div
            className={`
                fixed top-4 left-1/2 -translate-x-1/2 z-50
                flex items-center gap-3 px-4 py-3 rounded-xl
                shadow-2xl border backdrop-blur-sm
                animate-pulse
                ${isCritical
                    ? 'bg-red-500/95 border-red-400 shadow-red-500/50'
                    : isUrgent
                        ? 'bg-orange-500/95 border-orange-400 shadow-orange-500/50'
                        : 'bg-amber-500/95 border-amber-400 shadow-amber-500/50'
                }
            `}
            role="alert"
        >
            {/* Warning icon */}
            <div className={`
                flex items-center justify-center w-10 h-10 rounded-full
                ${isCritical ? 'bg-red-600' : isUrgent ? 'bg-orange-600' : 'bg-amber-600'}
            `}>
                <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>

            {/* Warning content */}
            <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-wide">
                    {isCritical ? 'MAKE A MOVE NOW!' : 'Make your move!'}
                </span>
                <span className="text-white/90 text-xs">
                    {remainingSeconds > 0
                        ? `${remainingSeconds}s remaining or you lose`
                        : 'Time expired!'
                    }
                </span>
            </div>

            {/* Countdown timer */}
            <div className={`
                flex items-center justify-center w-12 h-12 rounded-full
                font-mono font-bold text-xl
                ${isCritical
                    ? 'bg-red-700 text-white animate-bounce'
                    : isUrgent
                        ? 'bg-orange-600 text-white'
                        : 'bg-amber-600 text-white'
                }
            `}>
                {remainingSeconds}
            </div>
        </div>
    );
}
