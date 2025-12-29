'use client';

import { Button } from '@/components/ui/button';
import { TimeControl, useMatchmaking } from '@/features/game/hooks/useMatchMaking';
import { cn } from '@/lib/utils';

const TIME_CONTROLS: { id: TimeControl; label: string; time: string; description: string }[] = [
    { id: 'bullet', label: 'Bullet', time: '1 min', description: 'Fast & furious' },
    { id: 'blitz', label: 'Blitz', time: '3+2', description: 'Quick thinking' },
    { id: 'rapid', label: 'Rapid', time: '10 min', description: 'Balanced play' },
    { id: 'classical', label: 'Classical', time: '30 min', description: 'Deep analysis' },
];

export default function PlayPage() {
    const {
        isQueueing,
        timeControl,
        error,
        joinQueue,
        leaveQueue,
        setTimeControl,
    } = useMatchmaking();

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            {/* Header */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold">Play Chess</h1>
                <p className="mt-2 text-muted-foreground">
                    Choose a time control and find an opponent
                </p>
            </div>

            {/* Time Control Selection */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {TIME_CONTROLS.map((tc) => (
                    <button
                        key={tc.id}
                        type="button"
                        disabled={isQueueing}
                        onClick={() => setTimeControl(tc.id)}
                        className={cn(
                            'group relative flex flex-col items-center rounded-xl border-2 p-4 transition-all',
                            timeControl === tc.id
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-border bg-card hover:border-muted-foreground/50',
                            isQueueing && 'cursor-not-allowed opacity-50'
                        )}
                    >
                        <div className={cn(
                            'mb-1 text-2xl font-bold',
                            timeControl === tc.id ? 'text-emerald-500' : 'text-foreground'
                        )}>
                            {tc.time}
                        </div>
                        <div className={cn(
                            'text-sm font-medium',
                            timeControl === tc.id ? 'text-emerald-500' : 'text-foreground'
                        )}>
                            {tc.label}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            {tc.description}
                        </div>
                        {timeControl === tc.id && (
                            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Play Button */}
            <div className="flex flex-col items-center gap-4">
                {isQueueing ? (
                    <div className="flex flex-col items-center gap-4">
                        {/* Searching Animation */}
                        <div className="relative">
                            <div className="h-24 w-24 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-500" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium">Finding opponent...</p>
                            <p className="text-sm text-muted-foreground">
                                Searching for {TIME_CONTROLS.find((t) => t.id === timeControl)?.label} game
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="destructive"
                            size="lg"
                            onClick={leaveQueue}
                            className="mt-2"
                        >
                            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel Search
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="button"
                        size="lg"
                        onClick={() => joinQueue(timeControl)}
                        className="h-14 bg-emerald-500 px-12 text-lg font-semibold hover:bg-emerald-600"
                    >
                        <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Play {TIME_CONTROLS.find((t) => t.id === timeControl)?.label}
                    </Button>
                )}

                {error && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error}
                    </div>
                )}
            </div>

            {/* Quick Info */}
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="font-medium">Instant Matching</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Find opponents at your skill level in seconds
                    </p>
                </div>
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="font-medium">Rated Games</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Earn rating points and climb the leaderboard
                    </p>
                </div>
                <div className="rounded-xl border bg-card p-4 text-center">
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                    <h3 className="font-medium">Quick Rematch</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Challenge the same opponent again instantly
                    </p>
                </div>
            </div>
        </div>
    );
}
