'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/features/auth/hook/useAuth';
import { useDashboard, useUpdateProfile } from '@/features/profile/hooks/useProfile';
import { useFriends, usePendingRequests } from '@/features/friends/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { COUNTRIES, getCountryFlag } from '@/constants/country';
import Image from 'next/image';




// Format date
const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Rating card component
const RatingCard = ({
    timeControl,
    rating,
    games,
    wins,
    losses,
    draws,
}: {
    timeControl: string;
    rating: number;
    games: number;
    wins: number;
    losses: number;
    draws: number;
}) => {
    const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
    const icons: Record<string, string> = {
        bullet: '⚡',
        blitz: '🔥',
        rapid: '⏱️',
        classical: '♟️',
    };

    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium capitalize text-muted-foreground">
                    <span>{icons[timeControl] || '♟️'}</span>
                    {timeControl}
                </span>
                <span className="text-xs text-muted-foreground">{games} games</span>
            </div>
            <div className="mb-3 text-3xl font-bold">{rating}</div>
            <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-500">+{wins}</span>
                <span className="text-red-500">-{losses}</span>
                <span className="text-slate-400">={draws}</span>
                <span className="ml-auto text-muted-foreground">{winRate}% win</span>
            </div>
        </div>
    );
};

// Edit Profile Modal
const EditProfileModal = ({
    isOpen,
    onClose,
    currentData,
}: {
    isOpen: boolean;
    onClose: () => void;
    currentData: {
        username: string;
        bio: string;
        country: string;
    };
}) => {
    const [username, setUsername] = useState(currentData.username);
    const [bio, setBio] = useState(currentData.bio);
    const [country, setCountry] = useState(currentData.country);

    const updateProfile = useUpdateProfile();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfile.mutate(
            { username, bio, country },
            {
                onSuccess: () => {
                    onClose();
                },
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 hover:bg-muted"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Username</label>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your username"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={3}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Country</label>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="">Select a country</option>
                            {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {
                                        // getCountryFlag(c.code)
                                    } {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                        >
                            {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function MyProfilePage() {
    const [showEditModal, setShowEditModal] = useState(false);

    const { data: me, isLoading: meLoading } = useMe();
    const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
    const { data: friends = [] } = useFriends();
    const { data: pendingRequests = [] } = usePendingRequests();

    const isLoading = meLoading || dashboardLoading;

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading your profile…</p>
                </div>
            </div>
        );
    }

    if (!me || !dashboard) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Failed to load profile</p>
                <Link href="/dashboard">
                    <Button>Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    const { ratings, summary, recentGames } = dashboard;

    // Find best rating
    const ratingsArray = Object.entries(ratings).map(([key, value]) => ({
        timeControl: key,
        ...value,
    }));
    const bestRating = ratingsArray.reduce(
        (best, current) => (current.rating > best.rating ? current : best),
        { rating: 0, timeControl: '' }
    );

    console.log("country flag for me:", getCountryFlag(me.profile?.country));

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            {/* Profile Header */}
            <div className="mb-8 rounded-2xl border bg-card p-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="h-24 w-24 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 sm:h-32 sm:w-32">
                            {me.avatar_url ? (
                                <img
                                    src={me.avatar_url}
                                    alt={me.username}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white sm:text-4xl">
                                    {me.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card bg-emerald-500" />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold sm:text-3xl">{me.username}</h1>
                            {me.profile?.country && (
                                // <span className="text-2xl">
                                //     {getCountryFlag(me.profile.country)}
                                // </span>
                                <Image
                                    src={getCountryFlag(me.profile?.country)}
                                    alt={me.profile?.country || ''}
                                    width={32}
                                    height={24}
                                />
                            )}
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                                Online
                            </span>
                        </div>

                        {me.profile?.bio && (
                            <p className="mb-3 text-muted-foreground">{me.profile.bio}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {me.email}
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Joined {formatDate(me.createdAt)}
                            </div>
                            {bestRating.rating > 0 && (
                                <div className="flex items-center gap-1">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Best: {bestRating.rating} ({bestRating.timeControl})
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit Button */}
                    <Button
                        variant="outline"
                        onClick={() => setShowEditModal(true)}
                    >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="text-2xl font-bold">{summary.totalGames}</div>
                    <div className="text-sm text-muted-foreground">Total Games</div>
                </div>
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-500">{summary.wins}</div>
                    <div className="text-sm text-muted-foreground">Wins</div>
                </div>
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-red-500">{summary.losses}</div>
                    <div className="text-sm text-muted-foreground">Losses</div>
                </div>
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-amber-500">{summary.winRate}%</div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
            </div>

            {/* Social Stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-2">
                <Link href="/friends" className="rounded-xl border bg-card p-4 transition-colors hover:border-emerald-500/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{friends.length}</div>
                            <div className="text-sm text-muted-foreground">Friends</div>
                        </div>
                        <div className="rounded-full bg-emerald-500/10 p-3">
                            <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </Link>
                <Link href="/friends" className="rounded-xl border bg-card p-4 transition-colors hover:border-emerald-500/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{pendingRequests.length}</div>
                            <div className="text-sm text-muted-foreground">Pending Requests</div>
                        </div>
                        <div className="rounded-full bg-amber-500/10 p-3">
                            <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Ratings */}
            <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold">Your Ratings</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {ratingsArray.map((r) => (
                        <RatingCard
                            key={r.timeControl}
                            timeControl={r.timeControl}
                            rating={r.rating}
                            games={r.gamesPlayed}
                            wins={r.wins}
                            losses={r.losses}
                            draws={r.draws}
                        />
                    ))}
                </div>
            </div>

            {/* Recent Games */}
            <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Recent Games</h2>
                    <Link href="/history" className="text-sm text-emerald-500 hover:underline">
                        View All
                    </Link>
                </div>
                {recentGames.length === 0 ? (
                    <div className="rounded-xl border bg-card p-8 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="mb-1 font-semibold">No games yet</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Start playing to build your game history
                        </p>
                        <Link href="/play">
                            <Button className="bg-emerald-500 hover:bg-emerald-600">
                                Play Now
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {recentGames.slice(0, 5).map((game, index) => (
                            <Link
                                key={`game-${game.gameId}-${index}`}
                                href={`/game/${game.gameId}`}
                                className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:border-emerald-500/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold',
                                            game.result === 'win'
                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                : game.result === 'loss'
                                                    ? 'bg-red-500/10 text-red-500'
                                                    : 'bg-slate-500/10 text-slate-400'
                                        )}
                                    >
                                        {game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'D'}
                                    </div>
                                    <div>
                                        <div className="font-medium">vs {game.opponentName}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {game.timeControl} • {game.endedAt ? formatDate(game.endedAt) : 'In progress'}
                                        </div>
                                    </div>
                                </div>
                                <svg
                                    className="h-5 w-5 text-muted-foreground"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                currentData={{
                    username: me.username,
                    bio: me.profile?.bio || '',
                    country: me.profile?.country || '',
                }}
            />
        </div>
    );
}
