// components/dashboard/RatingsOverview.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardResponse } from '@/features/dashboard/type';

interface RatingsOverviewProps {
    ratings: DashboardResponse['data']['ratings'];
}

export function RatingsOverview({ ratings }: RatingsOverviewProps) {
    const ratingEntries = [
        { name: 'Bullet', key: 'bullet' as const, icon: '⚡' },
        { name: 'Blitz', key: 'blitz' as const, icon: '🔥' },
        { name: 'Rapid', key: 'rapid' as const, icon: '⏱️' },
        { name: 'Classical', key: 'classical' as const, icon: '👑' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Rating Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {ratingEntries.map(({ name, key, icon }) => {
                        const rating = ratings[key];
                        const winRate = rating.gamesPlayed > 0
                            ? ((rating.wins / rating.gamesPlayed) * 100).toFixed(1)
                            : '0.0';

                        return (
                            <div key={key} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{icon}</div>
                                    <div>
                                        <p className="text-sm font-medium">{name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {rating.gamesPlayed} games
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">{rating.rating}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {winRate}% win rate
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
