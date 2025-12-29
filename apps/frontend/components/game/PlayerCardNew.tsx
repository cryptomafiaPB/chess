'use client';

import React, { useMemo } from 'react';
import { useClockDisplay } from '@/features/game/hooks/useClockDisplay';
import type { ClockState, PresenceStatus } from '@/features/game/hooks/useGameState';

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
    compact?: boolean;
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
    compact = false,
}: Props) {
    const display = useClockDisplay(clocks, status);
    const timeMs = color === 'white' ? display.white : display.black;
    const timeFormatted = formatTime(timeMs);

    // Calculate timer progress for clock display
    const maxTimeMs = Math.max(clocks.white, clocks.black, 600000);
    const clockProgress = useMemo(() => {
        return Math.min(1, Math.max(0, timeMs / maxTimeMs));
    }, [timeMs, maxTimeMs]);

    // Inactivity timer calculations
    const inactivityRadius = compact ? 22 : 26;
    const inactivityCircumference = 2 * Math.PI * inactivityRadius;
    const inactivityProgress = inactivity?.progress ?? 1;
    const inactivityStrokeDashoffset = inactivityCircumference * (1 - inactivityProgress);
    const showInactivityRing = isActive && status === 'active' && inactivity?.isActive;

    // Determine inactivity ring color
    const getInactivityRingColor = () => {
        if (!inactivity) return '#38bdf8';
        if (inactivity.progress < 0.25) return '#ef4444';
        if (inactivity.progress < 0.5) return '#f59e0b';
        return '#38bdf8';
    };

    // Clock progress ring (inner)
    const clockRadius = compact ? 18 : 22;
    const clockCircumference = 2 * Math.PI * clockRadius;
    const clockStrokeDashoffset = clockCircumference * (1 - clockProgress);

    // Determine if time is low
    const isLowTime = timeMs < 30000;
    const isCriticalTime = timeMs < 10000;

    // Avatar size based on compact mode
    const avatarSize = compact ? 'w-10 h-10' : 'w-12 h-12';
    const svgSize = compact ? 52 : 64;
    const svgViewBox = compact ? '0 0 52 52' : '0 0 64 64';

    return (
        <div
            className={`
                relative flex items-center gap-2 rounded transition-all
                ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}
                ${isActive
                    ? 'bg-[#262522]'
                    : 'bg-[#1e1d1b]'}
            `}
        >
            {/* Avatar with circular timers */}
            <div className="relative shrink-0">
                {/* SVG container for rings */}
                <svg
                    className="absolute inset-0 -rotate-90"
                    width={svgSize}
                    height={svgSize}
                    viewBox={svgViewBox}
                    style={{
                        marginLeft: compact ? '-6px' : '-6px',
                        marginTop: compact ? '-6px' : '-6px'
                    }}
                >
                    {/* Inactivity ring (outer) - only when active */}
                    {showInactivityRing && (
                        <>
                            <circle
                                cx={svgSize / 2}
                                cy={svgSize / 2}
                                r={inactivityRadius}
                                fill="none"
                                stroke="rgba(100, 116, 139, 0.2)"
                                strokeWidth="3"
                            />
                            <circle
                                cx={svgSize / 2}
                                cy={svgSize / 2}
                                r={inactivityRadius}
                                fill="none"
                                stroke={getInactivityRingColor()}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={inactivityCircumference}
                                strokeDashoffset={inactivityStrokeDashoffset}
                                className="transition-all duration-100"
                                style={{
                                    filter: inactivity?.isWarning ? 'drop-shadow(0 0 4px currentColor)' : undefined
                                }}
                            />
                        </>
                    )}

                    {/* Clock progress ring (inner) - only when active */}
                    {isActive && status === 'active' && (
                        <>
                            <circle
                                cx={svgSize / 2}
                                cy={svgSize / 2}
                                r={clockRadius}
                                fill="none"
                                stroke="rgba(100, 116, 139, 0.3)"
                                strokeWidth="2"
                            />
                            <circle
                                cx={svgSize / 2}
                                cy={svgSize / 2}
                                r={clockRadius}
                                fill="none"
                                stroke={isCriticalTime ? '#ef4444' : isLowTime ? '#f59e0b' : '#38bdf8'}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray={clockCircumference}
                                strokeDashoffset={clockStrokeDashoffset}
                                className="transition-all duration-200"
                            />
                        </>
                    )}
                </svg>

                {/* Avatar */}
                <div
                    className={`
                        ${avatarSize} rounded-full flex items-center justify-center font-bold overflow-hidden
                        ${color === 'white' ? 'bg-slate-200 text-slate-800' : 'bg-slate-600 text-slate-100'}
                        ${presence === 'offline' ? 'opacity-60' : ''}
                        ${isActive ? 'ring-2 ring-offset-1 ring-offset-slate-800' : ''}
                        ${isActive && isLowTime ? 'ring-red-500/60' : isActive ? 'ring-sky-500/60' : ''}
                    `}
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <span className={compact ? 'text-sm' : 'text-base'}>
                            {username.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>

                {/* Country flag badge */}
                {country && (
                    <div
                        className="absolute -bottom-0.5 -right-0.5 w-4 h-3 rounded-sm overflow-hidden shadow-sm bg-[#3d3a37]"
                        title={country}
                    >
                        <img
                            src={`https://flagcdn.com/w20/${country.toLowerCase()}.png`}
                            alt={country}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* Online/Offline indicator */}
                <div
                    className={`
                        absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1e1d1b]
                        ${presence === 'online' ? 'bg-emerald-500' : 'bg-slate-500'}
                    `}
                />
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className={`font-semibold text-white truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                        {username}
                    </span>
                    {rating && (
                        <span className={`text-slate-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                            ({rating})
                        </span>
                    )}
                </div>

                {/* Captured pieces row */}
                {capturedPieces && !compact && (
                    <div className="flex items-center gap-0.5 mt-0.5 text-[10px] text-slate-400">
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

            {/* Timer display - Chess.com style */}
            <div
                className={`
                    font-mono font-bold rounded flex items-center justify-center
                    ${compact ? 'text-lg px-3 py-1 min-w-[72px]' : 'text-xl px-4 py-2 min-w-[90px]'}
                    ${isActive
                        ? isCriticalTime
                            ? 'bg-red-600 text-white animate-pulse'
                            : isLowTime
                                ? 'bg-amber-600 text-white'
                                : 'bg-[#81b64c] text-white'
                        : 'bg-[#3d3a37] text-slate-300'}
                `}
            >
                <span>{timeFormatted}</span>
            </div>
        </div>
    );
}
