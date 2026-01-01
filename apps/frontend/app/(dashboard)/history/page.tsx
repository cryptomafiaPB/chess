'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useGameHistory } from '@/features/game/hooks/useGameHistory';
import type { GameHistoryItem } from '@/features/game/api';
import { cn } from '@/lib/utils';

// Icons for time controls
const TimeControlIcons: Record<string, ReactNode> = {
    bullet: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>
    ),
    blitz: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        </svg>
    ),
    rapid: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    ),
    classical: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172" />
        </svg>
    ),
};

const TIME_CONTROL_LABELS: Record<string, string> = {
    bullet: 'Bullet',
    blitz: 'Blitz',
    rapid: 'Rapid',
    classical: 'Classical',
};

const RESULT_REASON_LABELS: Record<string, string> = {
    checkmate: 'Checkmate',
    resign: 'Resignation',
    resignation: 'Resignation',
    timeout: 'Timeout',
    inactivity: 'Inactivity',
    draw: 'Agreement',
    stalemate: 'Stalemate',
    insufficient_material: 'Insufficient Material',
    threefold_repetition: 'Repetition',
    fifty_move_rule: '50-Move Rule',
    repetition: 'Repetition',
    insufficient: 'Insufficient Material',
    fifty_move: '50-Move Rule',
};

// Stat card component
const StatCard = ({
    value,
    label,
    type,
}: {
    value: number;
    label: string;
    type: 'win' | 'loss' | 'draw';
}) => {
    const styles = {
        win: {
            bg: 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5',
            border: 'border-emerald-500/20',
            text: 'text-emerald-400',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172" />
                </svg>
            ),
        },
        loss: {
            bg: 'bg-gradient-to-br from-red-500/10 to-red-500/5',
            border: 'border-red-500/20',
            text: 'text-red-400',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                </svg>
            ),
        },
        draw: {
            bg: 'bg-gradient-to-br from-amber-500/10 to-amber-500/5',
            border: 'border-amber-500/20',
            text: 'text-amber-400',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
            ),
        },
    };

    const style = styles[type];

    return (
        <div className={cn('rounded-2xl border p-4 transition-all hover:scale-[1.02]', style.bg, style.border)}>
            <div className="flex items-center justify-between">
                <div className={cn('rounded-xl p-2', style.text, 'bg-current/10')}>{style.icon}</div>
            </div>
            <p className={cn('mt-3 text-3xl font-bold tabular-nums', style.text)}>{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
    );
};

function GameHistoryCard({ game }: { game: GameHistoryItem }) {
    const timeControl = TIME_CONTROL_LABELS[game.timeControl] || game.timeControl;
    const timeControlIcon = TimeControlIcons[game.timeControl] || TimeControlIcons.classical;
    const reasonLabel = game.resultReason ? RESULT_REASON_LABELS[game.resultReason] || game.resultReason : null;

    const resultStyles = {
        win: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400', label: 'Victory', indicator: 'bg-emerald-500' },
        loss: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', label: 'Defeat', indicator: 'bg-red-500' },
        draw: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', label: 'Draw', indicator: 'bg-amber-500' },
        null: { bg: 'bg-muted/50 border-border', text: 'text-muted-foreground', label: game.status === 'active' ? 'In Progress' : 'Aborted', indicator: 'bg-muted-foreground' },
    };

    const result = resultStyles[game.result ?? 'null'];

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    return (
        <div className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card/50 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-card">
            {/* Result indicator */}
            <div className={cn('h-14 w-1.5 shrink-0 rounded-full', result.indicator)} />

            {/* Opponent info */}
            <div className="flex flex-1 items-center gap-4 min-w-0">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-emerald-400 transition-transform duration-200 group-hover:scale-105">
                    {game.opponent.avatarUrl ? (
                        <img src={game.opponent.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-primary-foreground">
                            {game.opponent.username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <p className="truncate font-semibold">{game.opponent.username}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
                        <span
                            className={cn(
                                'inline-flex items-center gap-1',
                                game.playedAs === 'white' ? 'text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            {game.playedAs === 'white' ? '♔' : '♚'}
                            {game.playedAs === 'white' ? 'White' : 'Black'}
                        </span>
                        <span className="hidden text-border sm:inline">•</span>
                        <span className="hidden sm:inline">{formatDate(game.startedAt)}</span>
                    </div>
                </div>
            </div>

            {/* Time control */}
            <div className="hidden items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-sm sm:flex">
                <span className="text-muted-foreground">{timeControlIcon}</span>
                <span>{timeControl}</span>
            </div>

            {/* Result */}
            <div className="flex flex-col items-end gap-1">
                <span className={cn('rounded-xl border px-3 py-1.5 text-sm font-medium', result.bg, result.text)}>
                    {result.label}
                </span>
                {reasonLabel && <span className="text-xs text-muted-foreground">{reasonLabel}</span>}
            </div>

            {/* Arrow */}
            <svg
                className="h-5 w-5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
        </div>
    );
}

// Loading skeleton
const LoadingSkeleton = () => (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:py-8 animate-pulse">
        <div className="mb-6">
            <div className="h-8 w-48 rounded-lg bg-muted" />
            <div className="mt-2 h-4 w-64 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-muted" />
            ))}
        </div>
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted" />
            ))}
        </div>
    </div>
);

export default function HistoryPage() {
    const [page, setPage] = useState(0);
    const limit = 20;
    const { data, isLoading, error } = useGameHistory(limit, page * limit);

    const totalPages = data ? Math.ceil(data.total / limit) : 0;

    // Calculate stats
    const stats = data?.games
        ? {
            wins: data.games.filter((g) => g.result === 'win').length,
            losses: data.games.filter((g) => g.result === 'loss').length,
            draws: data.games.filter((g) => g.result === 'draw').length,
        }
        : { wins: 0, losses: 0, draws: 0 };

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Game History</h1>
                <p className="mt-1 text-muted-foreground">View your past games and track your progress</p>
            </div>

            {/* Error state */}
            {error && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 py-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h2 className="mb-2 text-xl font-semibold">Failed to load history</h2>
                    <p className="text-muted-foreground">Please try again later</p>
                </div>
            )}

            {/* Empty state */}
            {data && data.games.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card/50 py-20 text-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                        <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                    </div>
                    <h2 className="mb-2 text-xl font-semibold">No games yet</h2>
                    <p className="mb-6 text-muted-foreground">Start playing to see your game history here</p>
                    <Link
                        href="/play"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                        </svg>
                        Play Now
                    </Link>
                </div>
            )}

            {/* Stats summary */}
            {data && data.games.length > 0 && (
                <>
                    <div className="mb-8 grid grid-cols-3 gap-4">
                        <StatCard value={stats.wins} label="Wins" type="win" />
                        <StatCard value={stats.losses} label="Losses" type="loss" />
                        <StatCard value={stats.draws} label="Draws" type="draw" />
                    </div>

                    {/* Games list */}
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="font-semibold text-muted-foreground">Recent Games</h2>
                        <span className="text-sm text-muted-foreground">{data.total} total games</span>
                    </div>
                    <div className="space-y-3">
                        {data.games.map((game) => (
                            <GameHistoryCard key={game.id} game={game} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 font-medium transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Previous page"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                                <span className="hidden sm:inline">Previous</span>
                            </button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i;
                                    } else if (page < 3) {
                                        pageNum = i;
                                    } else if (page > totalPages - 4) {
                                        pageNum = totalPages - 5 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={cn(
                                                'h-10 w-10 rounded-xl font-medium transition-all',
                                                page === pageNum
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-card hover:bg-muted'
                                            )}
                                        >
                                            {pageNum + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 font-medium transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Next page"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
