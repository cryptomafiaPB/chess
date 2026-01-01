// components/dashboard/RatingsOverview.tsx
'use client';

import { cn } from '@/lib/utils';
import type { DashboardResponse } from '@/features/dashboard/type';

interface RatingsOverviewProps {
    ratings: DashboardResponse['data']['ratings'];
}

// Rating card icons
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
        </svg>
    ),
};

// Rating item component
const RatingItem = ({
    name,
    icon,
    rating,
    gamesPlayed,
    wins,
    losses,
    draws,
}: {
    name: string;
    icon: React.ReactNode;
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
}) => {
    const winRate = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(0) : '0';

    return (
        <div className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card/50 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-card">
            {/* Icon */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                {icon}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{name}</span>
                    <span className="text-2xl font-bold tracking-tight">{rating}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                    <span>{gamesPlayed} games</span>
                    <span>{winRate}% win rate</span>
                </div>

                {/* Win/Loss/Draw bar */}
                {gamesPlayed > 0 && (
                    <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-muted">
                        {wins > 0 && (
                            <div
                                className="bg-emerald-500 transition-all duration-500"
                                style={{ width: `${(wins / gamesPlayed) * 100}%` }}
                                title={`${wins} wins`}
                            />
                        )}
                        {draws > 0 && (
                            <div
                                className="bg-amber-500 transition-all duration-500"
                                style={{ width: `${(draws / gamesPlayed) * 100}%` }}
                                title={`${draws} draws`}
                            />
                        )}
                        {losses > 0 && (
                            <div
                                className="bg-red-500 transition-all duration-500"
                                style={{ width: `${(losses / gamesPlayed) * 100}%` }}
                                title={`${losses} losses`}
                            />
                        )}
                    </div>
                )}

                {/* Legend */}
                {gamesPlayed > 0 && (
                    <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">{wins}W</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            <span className="text-muted-foreground">{draws}D</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-muted-foreground">{losses}L</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export function RatingsOverview({ ratings }: RatingsOverviewProps) {
    const ratingEntries = [
        { name: 'Bullet', key: 'bullet' as const, icon: TimeControlIcons.bullet },
        { name: 'Blitz', key: 'blitz' as const, icon: TimeControlIcons.blitz },
        { name: 'Rapid', key: 'rapid' as const, icon: TimeControlIcons.rapid },
        { name: 'Classical', key: 'classical' as const, icon: TimeControlIcons.classical },
    ];

    return (
        <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Rating Overview</h2>
                    <p className="text-sm text-muted-foreground">Your performance across time controls</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                </div>
            </div>

            <div className="space-y-3">
                {ratingEntries.map(({ name, key, icon }) => {
                    const rating = ratings[key];
                    return (
                        <RatingItem
                            key={key}
                            name={name}
                            icon={icon}
                            rating={rating.rating}
                            gamesPlayed={rating.gamesPlayed}
                            wins={rating.wins}
                            losses={rating.losses}
                            draws={rating.draws}
                        />
                    );
                })}
            </div>
        </div>
    );
}
