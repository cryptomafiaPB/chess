'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type GameEventType = 'check' | 'checkmate' | 'stalemate' | 'draw' | 'timeout' | 'resign';

interface GameEventAnimationProps {
    type: GameEventType;
    winner?: 'white' | 'black' | null;
    onComplete?: () => void;
    show: boolean;
}

const eventConfig: Record<GameEventType, {
    title: string;
    icon: string;
    bgClass: string;
    textClass: string;
    duration: number;
}> = {
    check: {
        title: 'Check!',
        icon: '⚠️',
        bgClass: 'from-amber-500/20 to-orange-500/20',
        textClass: 'text-amber-400',
        duration: 1500,
    },
    checkmate: {
        title: 'Checkmate!',
        icon: '👑',
        bgClass: 'from-emerald-500/20 to-cyan-500/20',
        textClass: 'text-emerald-400',
        duration: 3000,
    },
    stalemate: {
        title: 'Stalemate',
        icon: '🤝',
        bgClass: 'from-slate-500/20 to-slate-600/20',
        textClass: 'text-slate-300',
        duration: 2500,
    },
    draw: {
        title: 'Draw',
        icon: '🤝',
        bgClass: 'from-slate-500/20 to-slate-600/20',
        textClass: 'text-slate-300',
        duration: 2500,
    },
    timeout: {
        title: 'Time Out!',
        icon: '⏰',
        bgClass: 'from-red-500/20 to-orange-500/20',
        textClass: 'text-red-400',
        duration: 2500,
    },
    resign: {
        title: 'Resigned',
        icon: '🏳️',
        bgClass: 'from-slate-500/20 to-slate-600/20',
        textClass: 'text-slate-300',
        duration: 2000,
    },
};

export function GameEventAnimation({ type, winner, onComplete, show }: GameEventAnimationProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    const config = eventConfig[type];

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            setIsExiting(false);

            const exitTimer = setTimeout(() => {
                setIsExiting(true);
            }, config.duration - 500);

            const hideTimer = setTimeout(() => {
                setIsVisible(false);
                onComplete?.();
            }, config.duration);

            return () => {
                clearTimeout(exitTimer);
                clearTimeout(hideTimer);
            };
        }
    }, [show, config.duration, onComplete]);

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-40 flex items-center justify-center pointer-events-none',
                isExiting ? 'animate-fade-out' : 'animate-fade-in'
            )}
        >
            <div
                className={cn(
                    'relative flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-br p-8 shadow-2xl backdrop-blur-xl',
                    config.bgClass,
                    isExiting ? 'animate-scale-out' : 'animate-scale-in'
                )}
            >
                {/* Animated icon */}
                <div className="animate-bounce text-6xl">{config.icon}</div>

                {/* Title */}
                <h2 className={cn('text-4xl font-black tracking-tight', config.textClass)}>
                    {config.title}
                </h2>

                {/* Winner display for checkmate */}
                {type === 'checkmate' && winner && (
                    <p className="text-lg text-slate-300">
                        {winner === 'white' ? 'White' : 'Black'} wins!
                    </p>
                )}

                {/* Decorative elements */}
                {type === 'checkmate' && (
                    <div className="absolute inset-0 overflow-hidden rounded-3xl">
                        <div className="absolute -left-4 -top-4 h-24 w-24 animate-ping rounded-full bg-emerald-500/20" />
                        <div className="absolute -bottom-4 -right-4 h-16 w-16 animate-ping rounded-full bg-cyan-500/20" style={{ animationDelay: '0.5s' }} />
                    </div>
                )}

                {type === 'check' && (
                    <div className="absolute inset-0 overflow-hidden rounded-3xl">
                        <div className="absolute inset-0 animate-pulse bg-amber-500/5" />
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Overlay that highlights the king square when in check.
 * This creates a visual indicator on the board itself.
 */
interface KingCheckHighlightProps {
    isInCheck: boolean;
    kingSquare?: string;
    orientation: 'white' | 'black';
}

export function KingCheckHighlight({ isInCheck, kingSquare, orientation }: KingCheckHighlightProps) {
    if (!isInCheck || !kingSquare) return null;

    // Convert algebraic notation to board coordinates
    const file = kingSquare.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = parseInt(kingSquare[1]) - 1; // 1=0, 2=1, etc.

    // Adjust for board orientation
    const col = orientation === 'white' ? file : 7 - file;
    const row = orientation === 'white' ? 7 - rank : rank;

    const left = `${col * 12.5}%`;
    const top = `${row * 12.5}%`;

    return (
        <div
            className="absolute z-10 pointer-events-none animate-pulse"
            style={{
                left,
                top,
                width: '12.5%',
                height: '12.5%',
            }}
        >
            <div className="absolute inset-0 rounded-sm bg-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.6)]" />
            <div className="absolute inset-1 rounded-sm border-2 border-red-500/60 animate-ping" style={{ animationDuration: '1.5s' }} />
        </div>
    );
}
