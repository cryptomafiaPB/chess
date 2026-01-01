// components/dashboard/DashboardStats.tsx
'use client';

import { cn } from '@/lib/utils';
import type { DashboardResponse } from '@/features/dashboard/type';

interface DashboardStatsProps {
    data: DashboardResponse['data'];
}

// Stat Card Component
const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    className,
}: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    trend?: { value: number; label: string };
    className?: string;
}) => (
    <div
        className={cn(
            'group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
            className
        )}
    >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex items-start justify-between">
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                {icon}
            </div>
        </div>

        {trend && (
            <div className="relative mt-4 flex items-center gap-2 border-t border-border/50 pt-4">
                <span
                    className={cn(
                        'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        trend.value >= 0
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-red-500/10 text-red-500'
                    )}
                >
                    {trend.value >= 0 ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                        </svg>
                    ) : (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                        </svg>
                    )}
                    {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
        )}
    </div>
);

// Icons
const GamesIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
    </svg>
);

const WinRateIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
);

const RatingIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
);

const StreakIcon = () => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
    </svg>
);

export function DashboardStats({ data }: DashboardStatsProps) {
    const { summary, ratings } = data;

    // Calculate best rating across all time controls
    const bestRating = Math.max(
        ratings.bullet.rating,
        ratings.blitz.rating,
        ratings.rapid.rating,
        ratings.classical.rating
    );

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Games */}
            <StatCard
                title="Total Games"
                value={summary.totalGames}
                subtitle="All time controls"
                icon={<GamesIcon />}
            />

            {/* Win Rate */}
            <StatCard
                title="Win Rate"
                value={`${summary.winRate.toFixed(1)}%`}
                subtitle={`${summary.wins}W / ${summary.losses}L / ${summary.draws}D`}
                icon={<WinRateIcon />}
            />

            {/* Best Rating */}
            <StatCard
                title="Best Rating"
                value={bestRating}
                subtitle="Highest achieved"
                icon={<RatingIcon />}
            />

            {/* Blitz Rating (Most popular) */}
            <StatCard
                title="Blitz Rating"
                value={ratings.blitz.rating}
                subtitle={`${ratings.blitz.gamesPlayed} games played`}
                icon={<StreakIcon />}
            />
        </div>
    );
}
