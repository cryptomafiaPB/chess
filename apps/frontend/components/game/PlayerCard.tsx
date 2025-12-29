'use client';

import React, { useMemo } from 'react';
import { useClockDisplay } from '@/features/game/hooks/useClockDisplay';
import type { ClockState, PresenceStatus } from '@/features/game/hooks/useGameState';
import Image from 'next/image';

interface CapturedPieces {
    pawns: number;
    knights: number;
    bishops: number;
    rooks: number;
    queens: number;
}

interface InactivityInfo {
    isActive: boolean;
    progress: number; // 0 to 1
    isWarning: boolean;
    warningSeconds: number | null;
}

interface Props {
    username: string;
    rating?: number;
    country?: string;
    clocks: ClockState;
    status: string;
    color: 'white' | 'black';
    isActive: boolean;
    presence: PresenceStatus;
    capturedPieces?: CapturedPieces;
    materialAdvantage?: number;
    avatarUrl?: string;
    inactivity?: InactivityInfo;
}

function formatTime(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function PlayerCard({
    username,
    rating,
    country,
    clocks,
    status,
    color,
    isActive,
    presence,
    capturedPieces,
    materialAdvantage = 0,
    avatarUrl,
    inactivity,
}: Props) {
    const display = useClockDisplay(clocks, status);
    const timeMs = color === 'white' ? display.white : display.black;
    const timeFormatted = formatTime(timeMs);

    // Calculate timer progress (assuming 10 minute = 600000ms max for circle)
    const maxTimeMs = clocks.white > clocks.black ? clocks.white : clocks.black;
    const initialTime = Math.max(maxTimeMs, 600000); // At least 10 min for visual
    const progress = useMemo(() => {
        const ratio = Math.min(1, Math.max(0, timeMs / initialTime));
        return ratio;
    }, [timeMs, initialTime]);

    // Inactivity timer circle calculations
    const inactivityRadius = 32;
    const inactivityCircumference = 2 * Math.PI * inactivityRadius;
    const inactivityProgress = inactivity?.progress ?? 1;
    const inactivityStrokeDashoffset = inactivityCircumference * (1 - inactivityProgress);
    const showInactivityRing = isActive && status === 'active' && inactivity?.isActive;

    // Determine inactivity ring color based on remaining time
    const getInactivityRingColor = () => {
        if (!inactivity) return '#38bdf8';
        if (inactivity.progress < 0.25) return '#ef4444'; // Red when < 15 seconds
        if (inactivity.progress < 0.5) return '#f59e0b'; // Orange when < 30 seconds
        return '#38bdf8'; // Sky blue otherwise
    };

    // SVG circle calculations
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    // Determine if time is low (less than 30 seconds)
    const isLowTime = timeMs < 30000;

    return (
        <div
            className={`
                relative flex items-center gap-3 rounded-xl px-3 py-2 transition-all
                ${isActive
                    ? 'bg-slate-700/90 ring-2 ring-sky-400/60 shadow-lg shadow-sky-500/20'
                    : 'bg-slate-800/70'}
            `}
        >
            {/* Avatar with circular timer */}
            <div className="relative shrink-0">
                {/* Inactivity ring animation (outermost circle) */}
                {showInactivityRing && (
                    <svg
                        className="absolute -inset-2.5 -rotate-90"
                        width="76"
                        height="76"
                        viewBox="0 0 76 76"
                    >
                        {/* Background circle */}
                        <circle
                            cx="38"
                            cy="38"
                            r={inactivityRadius}
                            fill="none"
                            stroke="rgba(100, 116, 139, 0.2)"
                            strokeWidth="4"
                        />
                        {/* Progress circle - depletes over time */}
                        <circle
                            cx="38"
                            cy="38"
                            r={inactivityRadius}
                            fill="none"
                            stroke={getInactivityRingColor()}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={inactivityCircumference}
                            strokeDashoffset={inactivityStrokeDashoffset}
                            className="transition-all duration-100"
                            style={{
                                filter: inactivity?.isWarning ? 'drop-shadow(0 0 6px currentColor)' : undefined
                            }}
                        />
                    </svg>
                )}
                {/* Timer circle (shows clock progress) */}
                {isActive && status === 'active' && (
                    <svg
                        className="absolute -inset-1 -rotate-90"
                        width="66"
                        height="66"
                        viewBox="0 0 66 66"
                    >
                        {/* Background circle */}
                        <circle
                            cx="33"
                            cy="33"
                            r={radius}
                            fill="none"
                            stroke="rgba(100, 116, 139, 0.3)"
                            strokeWidth="3"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="33"
                            cy="33"
                            r={radius}
                            fill="none"
                            stroke={isLowTime ? '#ef4444' : '#38bdf8'}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-200"
                        />
                    </svg>
                )}
                {/* Avatar */}
                <div
                    className={`
                        w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold
                        ${color === 'white' ? 'bg-slate-200 text-slate-800' : 'bg-slate-600 text-slate-100'}
                        ${presence === 'offline' ? 'opacity-50' : ''}
                    `}
                >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        username.charAt(0).toUpperCase()
                    )}
                </div>
                {/* Online indicator */}
                <Image
                    alt='country-flag'
                    width={100}
                    height={100}
                    src={country ? `https://github.com/hampusborgos/country-flags/tree/main/svg/${country}.svg` : 'https://static.vecteezy.com/system/resources/thumbnails/068/599/133/large/editorial-one-piece-symbol-waving-flag-green-screen-background-free-video.jpg'}
                    className={`
                        absolute -bottom-2.5 -right-2.5 w-9 h-5
                        ${presence === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}
                    `}
                />
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate text-sm">
                        {username}
                    </span>
                    {rating && (
                        <span className="text-xs text-slate-400">
                            ({rating})
                        </span>
                    )}
                </div>
                {/* Captured pieces */}
                {capturedPieces && (
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400">
                        {capturedPieces.pawns > 0 && <span>{capturedPieces.pawns}♟</span>}
                        {capturedPieces.knights > 0 && <span>{capturedPieces.knights}♞</span>}
                        {capturedPieces.bishops > 0 && <span>{capturedPieces.bishops}♝</span>}
                        {capturedPieces.rooks > 0 && <span>{capturedPieces.rooks}♜</span>}
                        {capturedPieces.queens > 0 && <span>{capturedPieces.queens}♛</span>}
                        {materialAdvantage !== 0 && (
                            <span className={materialAdvantage > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {materialAdvantage > 0 ? '+' : ''}{materialAdvantage}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Timer display */}
            <div className="flex items-center gap-2">
                <div
                    className={`
                        flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-base font-bold
                        ${isActive
                            ? isLowTime
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-sky-500/20 text-sky-400'
                            : 'bg-slate-700/50 text-slate-300'}
                    `}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="12" cy="12" r="9" strokeWidth="2" />
                        <path strokeLinecap="round" strokeWidth="2" d="M12 7v5l3 3" />
                    </svg>
                    {timeFormatted}
                </div>
            </div>
        </div>
    );
}
