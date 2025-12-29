// components/dashboard/RecentGames.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DashboardRecentGame } from '@/features/dashboard/type';
import Link from 'next/link';

interface RecentGamesProps {
    games: DashboardRecentGame[];
}

export function RecentGames({ games }: RecentGamesProps) {
    if (games.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Games</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No games played yet. Start playing to see your history!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Games</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {games.map((game, index) => (
                        <div
                            key={`${index}-${game.gameId}`}
                            className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded ${game.result === 'win'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : game.result === 'loss'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                            }`}
                                    >
                                        {game.result.toUpperCase()}
                                    </span>
                                    <span className="text-sm font-medium">
                                        vs {game.opponentName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <span className="capitalize">{game.timeControl}</span>
                                    <span>•</span>
                                    <span>
                                        {game.endedAt
                                            ? new Date(game.endedAt).toLocaleDateString()
                                            : 'Recently'}
                                    </span>
                                </div>
                            </div>
                            <Link href={`/game/${game.gameId}`}>
                                <Button variant="ghost" size="sm">
                                    View
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
