// components/dashboard/RecentGames.tsx
'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { DashboardRecentGame } from '@/features/dashboard/type';
import Link from 'next/link';

interface RecentGamesProps {
    games: DashboardRecentGame[];
}

// Time control icons
const TimeControlIcons: Record<string, React.ReactNode> = {
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

// Game card component
const GameCard = ({ game }: { game: DashboardRecentGame }) => {
    const resultConfig = {
        win: {
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30',
            text: 'text-emerald-500',
            indicator: 'bg-emerald-500',
            label: 'Victory',
        },
        loss: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            text: 'text-red-500',
            indicator: 'bg-red-500',
            label: 'Defeat',
        },
        draw: {
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
            text: 'text-amber-500',
            indicator: 'bg-amber-500',
            label: 'Draw',
        },
    };

    const result = resultConfig[game.result as keyof typeof resultConfig] || resultConfig.draw;

    const formatDate = (date: string | null) => {
        if (!date) return 'Recently';
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Link
            href={`/game/${game.gameId}`}
            className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-card"
        >
            {/* Result indicator */}
            <div className={cn('h-12 w-1 shrink-0 rounded-full', result.indicator)} />

            {/* Game info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', result.bg, result.text)}>
                        {result.label}
                    </span>
                    <span className="truncate font-medium">vs {game.opponentName}</span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5 capitalize">
                        {TimeControlIcons[game.timeControl] || TimeControlIcons.classical}
                        {game.timeControl}
                    </span>
                    <span>•</span>
                    <span>{formatDate(game.endedAt)}</span>
                </div>
            </div>

            {/* Arrow */}
            <svg
                className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
        </Link>
    );
};

// Empty state component
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5" />
            </svg>
        </div>
        <h3 className="font-semibold">No games yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
            Start playing to see your game history!
        </p>
        <Link href="/play" className="mt-4">
            <Button className="gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
                Play Now
            </Button>
        </Link>
    </div>
);

export function RecentGames({ games }: RecentGamesProps) {
    return (
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Recent Games</h2>
                    <p className="text-sm text-muted-foreground">Your latest matches</p>
                </div>
                {games.length > 0 && (
                    <Link href="/history">
                        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                            View all
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                            </svg>
                        </Button>
                    </Link>
                )}
            </div>

            {games.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-3">
                    {games.slice(0, 5).map((game, index) => (
                        <GameCard key={`${index}-${game.gameId}`} game={game} />
                    ))}
                </div>
            )}
        </div>
    );
}
