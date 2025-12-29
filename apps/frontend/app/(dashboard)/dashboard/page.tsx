'use client';

import Link from 'next/link';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentGames } from '@/components/dashboard/RecentGames';
import { RatingsOverview } from '@/components/dashboard/RatingsOverview';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const { data: response, isLoading, error, refetch } = useDashboard();

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading dashboard…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-4">
                <div className="rounded-full bg-red-500/10 p-4">
                    <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <p className="text-sm text-red-500">{(error as Error).message}</p>
                <Button size="sm" onClick={() => refetch()}>
                    Try Again
                </Button>
            </div>
        );
    }

    if (!response?.data) return null;

    const { me, ratings, summary, recentGames } = response.data;

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
                    <p className="mt-1 text-muted-foreground">
                        Welcome back, <span className="font-medium text-foreground">{me.username}</span>!
                    </p>
                </div>
                <Link href="/play">
                    <Button size="lg" className="w-full sm:w-auto">
                        <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
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
        </div>
    );
}
