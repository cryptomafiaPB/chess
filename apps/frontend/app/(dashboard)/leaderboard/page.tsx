'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLeaderboard } from '@/features/profile/hooks/useProfile';

type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical';

const timeControls: { id: TimeControl; label: string; description: string }[] = [
    { id: 'bullet', label: 'Bullet', description: '1 min games' },
    { id: 'blitz', label: 'Blitz', description: '3-5 min games' },
    { id: 'rapid', label: 'Rapid', description: '10-15 min games' },
    { id: 'classical', label: 'Classical', description: '30+ min games' },
];

// Icons
const TimeControlIcons = {
    bullet: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>
    ),
    blitz: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        </svg>
    ),
    rapid: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    ),
    classical: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172" />
        </svg>
    ),
};

// Medal component for top 3
const Medal = ({ rank }: { rank: number }) => {
    const config = {
        1: { bg: 'from-yellow-400 to-yellow-600', shadow: 'shadow-yellow-500/30', icon: '👑' },
        2: { bg: 'from-slate-300 to-slate-500', shadow: 'shadow-slate-400/30', icon: '🥈' },
        3: { bg: 'from-amber-600 to-amber-800', shadow: 'shadow-amber-600/30', icon: '🥉' },
    };
    const c = config[rank as keyof typeof config];

    return (
        <div
            className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-lg shadow-lg',
                c.bg,
                c.shadow
            )}
        >
            {c.icon}
        </div>
    );
};

// Leaderboard row component
const LeaderboardRow = ({
    rank,
    userId,
    username,
    avatar,
    rating,
    gamesPlayed,
    winRate,
    isCurrentUser,
}: {
    rank: number;
    userId: number;
    username: string;
    avatar: string | null;
    rating: number;
    gamesPlayed: number;
    winRate: number;
    isCurrentUser?: boolean;
}) => {
    const isTopThree = rank <= 3;

    return (
        <Link
            href={`/profile/${userId}`}
            className={cn(
                'group flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200',
                isCurrentUser
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card'
            )}
        >
            {/* Rank */}
            <div className="flex w-12 shrink-0 items-center justify-center">
                {isTopThree ? (
                    <Medal rank={rank} />
                ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
                        {rank}
                    </span>
                )}
            </div>

            {/* Avatar + Username */}
            <div className="flex flex-1 items-center gap-4 min-w-0">
                <div
                    className={cn(
                        'h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br transition-transform duration-200 group-hover:scale-105',
                        isTopThree
                            ? 'from-primary to-emerald-400 ring-2 ring-primary/30'
                            : 'from-muted to-muted-foreground/20'
                    )}
                >
                    {avatar ? (
                        <img src={avatar} alt={username} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-primary-foreground">
                            {username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={cn('truncate font-semibold', isCurrentUser && 'text-primary')}>
                            {username}
                        </span>
                        {isCurrentUser && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                You
                            </span>
                        )}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                        {gamesPlayed} games • {winRate}% win rate
                    </div>
                </div>
            </div>

            {/* Rating */}
            <div className="text-right">
                <div className={cn('text-2xl font-bold tabular-nums', isTopThree && 'text-primary')}>
                    {rating.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Rating</div>
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
        </Link>
    );
};

// Top 3 podium display
const Podium = ({
    players,
}: {
    players: Array<{
        rank: number;
        userId: number;
        username: string;
        avatar: string | null;
        rating: number;
    }>;
}) => {
    // Order: 2nd, 1st, 3rd
    const podiumConfig = [
        { index: 1, height: 'h-28', avatarSize: 'h-20 w-20', ring: 'ring-slate-400/50', delay: 'delay-100' },
        { index: 0, height: 'h-36', avatarSize: 'h-24 w-24', ring: 'ring-yellow-500/50', delay: 'delay-0' },
        { index: 2, height: 'h-24', avatarSize: 'h-18 w-18', ring: 'ring-amber-600/50', delay: 'delay-200' },
    ];

    return (
        <div className="mb-8 hidden items-end justify-center gap-4 md:flex">
            {podiumConfig.map(({ index, height, avatarSize, ring, delay }) => {
                const player = players[index];
                if (!player) return null;

                return (
                    <Link
                        key={player.userId}
                        href={`/profile/${player.userId}`}
                        className={cn('group flex flex-col items-center animate-fade-in', delay)}
                    >
                        {/* Avatar */}
                        <div
                            className={cn(
                                'mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-emerald-400 transition-all duration-300 group-hover:scale-110 ring-4',
                                avatarSize,
                                ring
                            )}
                        >
                            {player.avatar ? (
                                <img src={player.avatar} alt={player.username} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary-foreground">
                                    {player.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Username & Rating */}
                        <div className="mb-3 text-center">
                            <div className="font-semibold transition-colors group-hover:text-primary">{player.username}</div>
                            <div className="text-xl font-bold text-primary">{player.rating.toLocaleString()}</div>
                        </div>

                        {/* Podium */}
                        <div
                            className={cn(
                                'flex w-32 items-start justify-center rounded-t-2xl bg-gradient-to-t transition-all duration-300 group-hover:scale-105',
                                height,
                                index === 0
                                    ? 'from-yellow-500/10 to-yellow-500/30'
                                    : index === 1
                                        ? 'from-slate-400/10 to-slate-400/20'
                                        : 'from-amber-600/10 to-amber-600/20'
                            )}
                        >
                            <div className="mt-4">
                                <Medal rank={player.rank} />
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

// Loading skeleton
const LoadingSkeleton = () => (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:py-8 animate-pulse">
        <div className="mb-6">
            <div className="h-8 w-48 rounded-lg bg-muted" />
            <div className="mt-2 h-4 w-64 rounded bg-muted" />
        </div>
        <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 w-24 rounded-xl bg-muted" />
            ))}
        </div>
        <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted" />
            ))}
        </div>
    </div>
);

// Empty state
const EmptyState = () => (
    <div className="py-20 text-center">
        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
            <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172" />
            </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold">No rankings yet</h3>
        <p className="mb-6 text-muted-foreground">Play some games to appear on the leaderboard!</p>
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
);

export default function LeaderboardPage() {
    const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('blitz');
    const { data: leaderboard = [], isLoading } = useLeaderboard(selectedTimeControl, 100);

    // Mock current user ID - in real app, get from auth context
    const currentUserId = 1;

    const topThree = leaderboard.slice(0, 3).map((player: any, index: number) => ({
        ...player,
        rank: index + 1,
    }));

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Leaderboard</h1>
                <p className="mt-1 text-muted-foreground">Top players ranked by rating</p>
            </div>

            {/* Time Control Selector */}
            <div className="mb-8 flex flex-wrap gap-2">
                {timeControls.map((tc) => (
                    <button
                        key={tc.id}
                        onClick={() => setSelectedTimeControl(tc.id)}
                        className={cn(
                            'flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200',
                            selectedTimeControl === tc.id
                                ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-card hover:text-foreground'
                        )}
                        aria-pressed={selectedTimeControl === tc.id}
                    >
                        {TimeControlIcons[tc.id]}
                        <div className="text-left">
                            <div className="font-semibold">{tc.label}</div>
                            <div className="text-xs opacity-70">{tc.description}</div>
                        </div>
                    </button>
                ))}
            </div>

            {leaderboard.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                    {/* Podium for Top 3 */}
                    {topThree.length >= 3 && <Podium players={topThree} />}

                    {/* Full Leaderboard */}
                    <div className="space-y-3">
                        {leaderboard.map((player: any, index: number) => (
                            <LeaderboardRow
                                key={player.userId}
                                rank={index + 1}
                                userId={player.userId}
                                username={player.username}
                                avatar={player.avatar}
                                rating={player.rating}
                                gamesPlayed={player.gamesPlayed}
                                winRate={player.winRate}
                                isCurrentUser={player.userId === currentUserId}
                            />
                        ))}
                    </div>

                    {/* Stats Footer */}
                    <div className="mt-8 rounded-2xl border border-border/50 bg-card/50 p-6">
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                                <div className="text-3xl font-bold text-primary">{leaderboard.length}</div>
                                <div className="mt-1 text-sm text-muted-foreground">Ranked Players</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">
                                    {Math.round(leaderboard.reduce((acc: number, p: any) => acc + p.rating, 0) / leaderboard.length) || 0}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">Average Rating</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{leaderboard[0]?.rating?.toLocaleString() || 0}</div>
                                <div className="mt-1 text-sm text-muted-foreground">Top Rating</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
