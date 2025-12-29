'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProfile } from '@/features/profile/hooks/useProfile';
import {
    useFriendshipStatus,
    useSendFriendRequest,
    useRemoveFriend,
    useBlockUser,
} from '@/features/friends/hooks/useFriends';
import { useMe } from '@/features/auth/hook/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getCountryFlag } from '@/constants/country';
import Image from 'next/image';


// Format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium capitalize text-muted-foreground">
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

export default function ProfilePage() {
    const params = useParams<{ userId: string }>();
    const router = useRouter();
    const userId = params.userId;

    const { data: me, isLoading: meLoading } = useMe();
    const { data: profile, isLoading, error } = useProfile(userId);
    const { data: friendshipStatus, isLoading: statusLoading } = useFriendshipStatus(
        Number(userId)
    );

    const sendRequest = useSendFriendRequest();
    const removeFriend = useRemoveFriend();
    const blockUser = useBlockUser();

    const [showActions, setShowActions] = useState(false);

    const isOwnProfile = me?.id === Number(userId);

    // Redirect to /profile/me if viewing own profile
    useEffect(() => {
        if (!meLoading && me && isOwnProfile) {
            router.replace('/profile/me');
        }
    }, [meLoading, me, isOwnProfile, router]);

    // Loading state
    if (isLoading || meLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading profile…</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !profile) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
                <div className="rounded-full bg-red-500/10 p-4">
                    <svg
                        className="h-8 w-8 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>
                <h2 className="text-xl font-bold">User Not Found</h2>
                <p className="text-sm text-muted-foreground">
                    This user doesn't exist or their profile is private.
                </p>
                <Link href="/dashboard">
                    <Button>Back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    const handleAddFriend = () => {
        sendRequest.mutate(Number(userId));
    };

    const handleRemoveFriend = () => {
        removeFriend.mutate(Number(userId));
    };

    const handleBlock = () => {
        if (confirm('Are you sure you want to block this user?')) {
            blockUser.mutate(Number(userId));
        }
    };

    // Get best rating
    const bestRating = profile.ratings.reduce(
        (best, current) => (current.rating > best.rating ? current : best),
        { rating: 0, timeControl: '' }
    );

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            {/* Profile Header */}
            <div className="mb-8 rounded-2xl border bg-card p-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="h-24 w-24 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 sm:h-32 sm:w-32">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.username}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white sm:text-4xl">
                                    {profile.username.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        {/* Online indicator */}
                        {profile.profile?.isOnline && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-card bg-emerald-500" />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                            <h1 className="text-2xl font-bold sm:text-3xl">{profile.username}</h1>
                            {profile.profile?.country && (
                                // <span className="text-2xl">
                                //     {getCountryFlag(profile.profile.country)}
                                // </span>
                                <Image
                                    src={getCountryFlag(profile.profile.country)}
                                    alt={profile.profile.country}
                                    width={32}
                                    height={24}
                                />
                            )}
                            {profile.profile?.isOnline ? (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                                    Online
                                </span>
                            ) : (
                                <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs font-medium text-slate-400">
                                    Offline
                                </span>
                            )}
                        </div>

                        {profile.profile?.bio && (
                            <p className="mb-3 text-muted-foreground">{profile.profile.bio}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                Joined {formatDate(profile.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                                <svg
                                    className="h-4 w-4"
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
                                Best: {bestRating.rating} ({bestRating.timeControl})
                            </div>
                            <div className="flex items-center gap-1">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                                {profile.stats.totalGames} games played
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {!isOwnProfile && (
                        <div className="relative flex gap-2">
                            {/* No relationship - show Add Friend */}
                            {friendshipStatus === 'none' && (
                                <Button
                                    onClick={handleAddFriend}
                                    disabled={sendRequest.isPending}
                                    className="bg-emerald-500 hover:bg-emerald-600"
                                >
                                    {sendRequest.isPending ? (
                                        'Sending...'
                                    ) : (
                                        <>
                                            <svg
                                                className="mr-2 h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                                />
                                            </svg>
                                            Add Friend
                                        </>
                                    )}
                                </Button>
                            )}
                            {/* Request sent - waiting for acceptance */}
                            {friendshipStatus === 'request_sent' && (
                                <Button variant="outline" disabled>
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    Request Sent
                                </Button>
                            )}
                            {/* Request received - can accept */}
                            {friendshipStatus === 'request_received' && (
                                <Button
                                    onClick={handleAddFriend}
                                    disabled={sendRequest.isPending}
                                    className="bg-emerald-500 hover:bg-emerald-600"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    Accept Request
                                </Button>
                            )}
                            {/* Already friends - show Friends badge with remove option */}
                            {friendshipStatus === 'active' && (
                                <Button
                                    variant="outline"
                                    onClick={handleRemoveFriend}
                                    disabled={removeFriend.isPending}
                                    className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    {removeFriend.isPending ? 'Removing...' : 'Friends'}
                                </Button>
                            )}
                            {/* Blocked user */}
                            {friendshipStatus === 'blocked' && (
                                <Button variant="outline" disabled className="border-red-500/50 text-red-500">
                                    Blocked
                                </Button>
                            )}

                            {/* More actions dropdown */}
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setShowActions(!showActions)}
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                        />
                                    </svg>
                                </Button>
                                {showActions && (
                                    <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-lg border bg-card py-1 shadow-lg">
                                        <button
                                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-muted"
                                            onClick={handleBlock}
                                        >
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                                />
                                            </svg>
                                            Block User
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isOwnProfile && (
                        <Link href="/settings">
                            <Button variant="outline">
                                <svg
                                    className="mr-2 h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                Edit Profile
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="text-2xl font-bold">{profile.stats.totalGames}</div>
                    <div className="text-sm text-muted-foreground">Total Games</div>
                </div>
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-500">
                        {profile.stats.totalWins}
                    </div>
                    <div className="text-sm text-muted-foreground">Wins</div>
                </div>
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-red-500">
                        {profile.stats.totalLosses}
                    </div>
                    <div className="text-sm text-muted-foreground">Losses</div>
                </div>
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="text-2xl font-bold text-amber-500">
                        {profile.stats.longestWinStreak}
                    </div>
                    <div className="text-sm text-muted-foreground">Best Streak</div>
                </div>
            </div>

            {/* Ratings */}
            <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold">Ratings</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {profile.ratings.map((r) => (
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

            {/* Challenge Button */}
            {!isOwnProfile && profile.profile?.isOnline && (
                <div className="text-center">
                    <Link href="/play">
                        <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600">
                            <svg
                                className="mr-2 h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Challenge to a Game
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
