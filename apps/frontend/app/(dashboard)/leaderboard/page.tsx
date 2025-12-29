'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLeaderboard } from '@/features/profile/hooks/useProfile';

type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical';

const timeControls: { id: TimeControl; label: string; icon: string }[] = [
    { id: 'bullet', label: 'Bullet', icon: '⚡' },
    { id: 'blitz', label: 'Blitz', icon: '🔥' },
    { id: 'rapid', label: 'Rapid', icon: '⏱️' },
    { id: 'classical', label: 'Classical', icon: '♟️' },
];

// Medal component for top 3
const Medal = ({ rank }: { rank: number }) => {
    const colors = {
        1: 'from-yellow-400 to-yellow-600',
        2: 'from-slate-300 to-slate-500',
        3: 'from-amber-600 to-amber-800',
    };

    return (
        <div
            className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-lg',
                colors[rank as keyof typeof colors]
            )}
        >
            {rank}
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
                'group flex items-center gap-4 rounded-xl border p-4 transition-all hover:border-emerald-500/50 hover:bg-card/80',
                isCurrentUser && 'border-emerald-500/30 bg-emerald-500/5',
                isTopThree && 'bg-gradient-to-r from-card to-transparent'
            )}
        >
            {/* Rank */}
            <div className="w-10 flex-shrink-0">
                {isTopThree ? (
                    <Medal rank={rank} />
                ) : (
                    <span className="flex h-8 w-8 items-center justify-center text-sm font-medium text-muted-foreground">
                        {rank}
                    </span>
                )}
            </div>

            {/* Avatar + Username */}
            <div className="flex flex-1 items-center gap-3">
                <div
                    className={cn(
                        'h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br',
                        isTopThree
                            ? 'from-emerald-500 to-cyan-500 ring-2 ring-emerald-500/30'
                            : 'from-slate-600 to-slate-700'
                    )}
                >
                    {avatar ? (
                        <img src={avatar} alt={username} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-white">
                            {username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                'font-medium',
                                isCurrentUser && 'text-emerald-500'
                            )}
                        >
                            {username}
                        </span>
                        {isCurrentUser && (
                            <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-500">
                                You
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {gamesPlayed} games • {winRate}% win rate
                    </div>
                </div>
            </div>

            {/* Rating */}
            <div className="text-right">
                <div
                    className={cn(
                        'text-xl font-bold',
                        isTopThree ? 'text-emerald-500' : 'text-foreground'
                    )}
                >
                    {rating}
                </div>
                <div className="text-xs text-muted-foreground">Rating</div>
            </div>

            {/* Arrow */}
            <svg
                className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                />
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
    const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd
    const heights = ['h-24', 'h-32', 'h-20'];
    const positions = ['bg-gradient-to-t from-slate-400/20', 'bg-gradient-to-t from-yellow-500/20', 'bg-gradient-to-t from-amber-700/20'];

    return (
        <div className="mb-8 hidden items-end justify-center gap-2 md:flex">
            {podiumOrder.map((index, displayIndex) => {
                const player = players[index];
                if (!player) return null;

                return (
                    <Link
                        key={player.userId}
                        href={`/profile/${player.userId}`}
                        className="group flex flex-col items-center"
                    >
                        {/* Avatar */}
                        <div
                            className={cn(
                                'mb-2 overflow-hidden rounded-full transition-transform group-hover:scale-110',
                                index === 0
                                    ? 'h-20 w-20 ring-4 ring-yellow-500/50'
                                    : index === 1
                                        ? 'h-16 w-16 ring-4 ring-slate-400/50'
                                        : 'h-14 w-14 ring-4 ring-amber-700/50'
                            )}
                        >
                            <div className="h-full w-full bg-gradient-to-br from-emerald-500 to-cyan-500">
                                {player.avatar ? (
                                    <img
                                        src={player.avatar}
                                        alt={player.username}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                                        {player.username.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Username & Rating */}
                        <div className="mb-2 text-center">
                            <div className="font-medium">{player.username}</div>
                            <div className="text-lg font-bold text-emerald-500">{player.rating}</div>
                        </div>

                        {/* Podium */}
                        <div
                            className={cn(
                                'flex w-28 items-center justify-center rounded-t-lg',
                                heights[displayIndex],
                                positions[displayIndex]
                            )}
                        >
                            <Medal rank={player.rank} />
                        </div>
                    </Link>
                );
            })}
        </div>
    );
};

export default function LeaderboardPage() {
    const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('blitz');
    const { data: leaderboard = [], isLoading } = useLeaderboard(selectedTimeControl, 100);

    // Mock current user ID - in real app, get from auth context
    const currentUserId = 1;

    const topThree = leaderboard.slice(0, 3).map((player: any, index: number) => ({
        ...player,
        rank: index + 1,
    }));

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold sm:text-3xl">Leaderboard</h1>
                <p className="mt-1 text-muted-foreground">
                    Top players ranked by rating
                </p>
            </div>

            {/* Time Control Selector */}
            <div className="mb-6 flex flex-wrap gap-2">
                {timeControls.map((tc) => (
                    <button
                        key={tc.id}
                        onClick={() => setSelectedTimeControl(tc.id)}
                        className={cn(
                            'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                            selectedTimeControl === tc.id
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                                : 'border-border bg-card text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                        )}
                    >
                        <span>{tc.icon}</span>
                        <span>{tc.label}</span>
                    </button>
                ))}
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="py-20 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <svg
                            className="h-8 w-8 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                    </div>
                    <h3 className="mb-1 font-semibold">No rankings yet</h3>
                    <p className="text-sm text-muted-foreground">
                        Play some games to appear on the leaderboard!
                    </p>
                    <Link
                        href="/play"
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
                    >
                        Play Now
                    </Link>
                </div>
            ) : (
                <>
                    {/* Podium for Top 3 */}
                    {topThree.length >= 3 && <Podium players={topThree} />}

                    {/* Full Leaderboard */}
                    <div className="space-y-2">
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
                    <div className="mt-8 rounded-xl border bg-card p-6 text-center">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-2xl font-bold text-emerald-500">
                                    {leaderboard.length}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Ranked Players
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {Math.round(
                                        leaderboard.reduce(
                                            (acc: number, p: any) => acc + p.rating,
                                            0
                                        ) / leaderboard.length
                                    ) || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Average Rating
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    {leaderboard[0]?.rating || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Top Rating
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
