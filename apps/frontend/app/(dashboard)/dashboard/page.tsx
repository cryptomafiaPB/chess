'use client';

import Link from 'next/link';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentGames } from '@/components/dashboard/RecentGames';
import { RatingsOverview } from '@/components/dashboard/RatingsOverview';
import { Button } from '@/components/ui/button';

// Icons
const PlayIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
    </svg>
);

const AlertIcon = () => (
    <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

// Loading skeleton component
const LoadingSkeleton = () => (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-6 lg:p-8 animate-pulse">
        {/* Header skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <div className="h-8 w-48 rounded-lg bg-muted" />
                <div className="mt-2 h-4 w-64 rounded bg-muted" />
            </div>
            <div className="h-12 w-32 rounded-xl bg-muted" />
        </div>

        {/* Stats skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-muted" />
            ))}
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-2xl bg-muted" />
            <div className="h-80 rounded-2xl bg-muted" />
        </div>
    </div>
);

export default function DashboardPage() {
    const { data: response, isLoading, error, refetch } = useDashboard();

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-4">
                <div className="rounded-2xl bg-destructive/10 p-6">
                    <AlertIcon />
                </div>
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Something went wrong</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{(error as Error).message}</p>
                </div>
                <Button onClick={() => refetch()} className="gap-2">
                    <RefreshIcon />
                    Try Again
                </Button>
            </div>
        );
    }

    if (!response?.data) return null;

    const { me, ratings, summary, recentGames } = response.data;

    return (
        <div className="mx-auto w-full max-w-7xl space-y-8 p-4 md:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                        Welcome back, <span className="text-gradient">{me.username}</span>
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Here's your chess journey at a glance
                    </p>
                </div>
                <Link href="/play">
                    <Button size="lg" className="w-full gap-2 bg-gradient-to-r from-primary to-emerald-400 shadow-lg shadow-primary/25 hover:shadow-primary/40 sm:w-auto">
                        <PlayIcon />
                        Play Now
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <DashboardStats data={{ me, ratings, summary, recentGames }} />

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Ratings Overview */}
                <RatingsOverview ratings={ratings} />

                {/* Recent Games */}
                <RecentGames games={recentGames} />
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
                <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Link
                        href="/play"
                        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <PlayIcon />
                        </div>
                        <div>
                            <p className="font-medium">Quick Match</p>
                            <p className="text-sm text-muted-foreground">Find an opponent</p>
                        </div>
                    </Link>

                    <Link
                        href="/friends"
                        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">Challenge Friend</p>
                            <p className="text-sm text-muted-foreground">Play with friends</p>
                        </div>
                    </Link>

                    <Link
                        href="/leaderboard"
                        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">Leaderboard</p>
                            <p className="text-sm text-muted-foreground">View rankings</p>
                        </div>
                    </Link>

                    <Link
                        href="/profile/me"
                        className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium">My Profile</p>
                            <p className="text-sm text-muted-foreground">View & edit profile</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
