'use client';

import React, { useMemo } from 'react';
import { useClockDisplay } from '@/features/game/hooks/useClockDisplay';
import type { ClockState, PresenceStatus } from '@/features/game/hooks/useGameState';
import Image from 'next/image';
import { Clock, User, Crown, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CapturedPieces {
    pawns: number;
    knights: number;
    bishops: number;
    rooks: number;
    queens: number;
}

interface InactivityInfo {
    isActive: boolean;
    progress: number;
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

    // Calculate timer progress for circle visualization
    const maxTimeMs = clocks.white > clocks.black ? clocks.white : clocks.black;
    const initialTime = Math.max(maxTimeMs, 600000);
    const progress = useMemo(() => {
        const ratio = Math.min(1, Math.max(0, timeMs / initialTime));
        return ratio;
    }, [timeMs, initialTime]);

    // Inactivity timer circle calculations
    const inactivityRadius = 24;
    const inactivityCircumference = 2 * Math.PI * inactivityRadius;
    const inactivityProgress = inactivity?.progress ?? 1;
    const inactivityStrokeDashoffset = inactivityCircumference * (1 - inactivityProgress);
    const showInactivityRing = isActive && status === 'active' && inactivity?.isActive;

    // Time progress circle calculations
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    // Low time state (less than 30 seconds)
    const isLowTime = timeMs < 30000;
    const isCriticalTime = timeMs < 10000;

    // Determine ring colors
    const getTimerColor = () => {
        if (isCriticalTime) return 'oklch(0.637 0.237 25.331)';
        if (isLowTime) return 'oklch(0.769 0.188 70.08)';
        return 'oklch(0.696 0.17 162.48)';
    };

    const getInactivityRingColor = () => {
        if (!inactivity) return 'oklch(0.696 0.17 162.48)';
        if (inactivity.progress < 0.25) return 'oklch(0.637 0.237 25.331)';
        if (inactivity.progress < 0.5) return 'oklch(0.769 0.188 70.08)';
        return 'oklch(0.696 0.17 162.48)';
    };

    return (
        <div
            className={cn(
                'relative flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300',
                'bg-card/80 border border-border/50 backdrop-blur-sm',
                isActive && [
                    'ring-2 ring-primary/50 border-primary/50',
                    'shadow-lg shadow-primary/10',
                    'bg-card'
                ],
                !isActive && 'hover:bg-card/90'
            )}
        >
            {/* Avatar Section with Timer Ring */}
            <div className="relative shrink-0">
                {/* Inactivity Warning Ring (outer) */}
                {showInactivityRing && (
                    <svg
                        className="absolute -inset-1.5 w-[60px] h-[60px] -rotate-90"
                        viewBox="0 0 56 56"
                    >
                        {/* Background ring */}
                        <circle
                            cx="28"
                            cy="28"
                            r={inactivityRadius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-muted-foreground/20"
                        />
                        {/* Progress ring */}
                        <circle
                            cx="28"
                            cy="28"
                            r={inactivityRadius}
                            fill="none"
                            stroke={getInactivityRingColor()}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={inactivityCircumference}
                            strokeDashoffset={inactivityStrokeDashoffset}
                            className={cn(
                                'transition-all duration-200',
                                inactivity?.isWarning && 'animate-pulse'
                            )}
                        />
                    </svg>
                )}

                {/* Timer Progress Ring (inner, when active) */}
                {isActive && (
                    <svg
                        className="absolute inset-0 w-full h-full -rotate-90"
                        viewBox="0 0 52 52"
                    >
                        {/* Background circle */}
                        <circle
                            cx="26"
                            cy="26"
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-muted-foreground/20"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="26"
                            cy="26"
                            r={radius}
                            fill="none"
                            stroke={getTimerColor()}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-200"
                        />
                    </svg>
                )}

                {/* Avatar */}
                <div
                    className={cn(
                        'relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden',
                        'text-lg font-bold transition-all duration-200',
                        color === 'white'
                            ? 'bg-linear-to-br from-slate-100 to-slate-300 text-slate-800'
                            : 'bg-linear-to-br from-slate-700 to-slate-900 text-slate-100',
                        presence === 'offline' && 'opacity-60 grayscale'
                    )}
                >
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={username}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <User className="w-5 h-5" />
                    )}
                </div>

                {/* Country Flag / Presence Indicator */}
                <div
                    className={cn(
                        'absolute -bottom-1 -right-1 w-5 h-5 rounded-full',
                        'flex items-center justify-center',
                        'border-2 border-card text-[10px]',
                        presence === 'online'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                    )}
                >
                    {country ? (
                        <span className="text-[10px] font-semibold uppercase">{country.slice(0, 2)}</span>
                    ) : presence === 'online' ? (
                        <Wifi className="w-2.5 h-2.5" />
                    ) : (
                        <WifiOff className="w-2.5 h-2.5" />
                    )}
                </div>
            </div>

            {/* Player Info Section */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        'font-semibold truncate text-sm',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                        {username}
                    </span>
                    {rating && (
                        <span className="text-xs text-muted-foreground/70 font-medium">
                            ({rating})
                        </span>
                    )}
                    {/* Active turn indicator */}
                    {isActive && (
                        <Crown className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                </div>

                {/* Captured pieces display */}
                {capturedPieces && (
                    <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                        <div className="flex items-center gap-0.5 text-xs">
                            {capturedPieces.pawns > 0 && (
                                <span className="opacity-70">{capturedPieces.pawns}♟</span>
                            )}
                            {capturedPieces.knights > 0 && (
                                <span className="opacity-70">{capturedPieces.knights}♞</span>
                            )}
                            {capturedPieces.bishops > 0 && (
                                <span className="opacity-70">{capturedPieces.bishops}♝</span>
                            )}
                            {capturedPieces.rooks > 0 && (
                                <span className="opacity-70">{capturedPieces.rooks}♜</span>
                            )}
                            {capturedPieces.queens > 0 && (
                                <span className="opacity-70">{capturedPieces.queens}♛</span>
                            )}
                        </div>
                        {materialAdvantage !== 0 && (
                            <span className={cn(
                                'text-xs font-semibold',
                                materialAdvantage > 0 ? 'text-primary' : 'text-destructive'
                            )}>
                                {materialAdvantage > 0 ? '+' : ''}{materialAdvantage}
                            </span>
                        )}
                    </div>
                )}

                {/* Inactivity warning */}
                {inactivity?.isWarning && inactivity.warningSeconds !== null && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Auto-resign in {inactivity.warningSeconds}s</span>
                    </div>
                )}
            </div>

            {/* Timer Display */}
            <div className="flex items-center shrink-0">
                <div
                    className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-base font-bold transition-all',
                        isActive && [
                            isCriticalTime && 'bg-destructive/20 text-destructive animate-pulse',
                            isLowTime && !isCriticalTime && 'bg-amber-500/20 text-amber-500',
                            !isLowTime && 'bg-primary/20 text-primary'
                        ],
                        !isActive && 'bg-muted/50 text-muted-foreground'
                    )}
                >
                    <Clock className={cn(
                        'w-4 h-4',
                        isActive && isLowTime && 'animate-pulse'
                    )} />
                    <span className="tabular-nums">{timeFormatted}</span>
                </div>
            </div>
        </div>
    );
}
