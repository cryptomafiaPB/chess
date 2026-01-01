'use client';

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TimeControl, useMatchmaking } from '@/features/game/hooks/useMatchMaking';
import { cn } from '@/lib/utils';

const TIME_CONTROLS: { id: TimeControl; label: string; time: string; description: string; icon: ReactNode }[] = [
    {
        id: 'bullet',
        label: 'Bullet',
        time: '1 min',
        description: 'Fast & furious',
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
        ),
    },
    {
        id: 'blitz',
        label: 'Blitz',
        time: '3+2',
        description: 'Quick thinking',
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
            </svg>
        ),
    },
    {
        id: 'rapid',
        label: 'Rapid',
        time: '10 min',
        description: 'Balanced play',
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
    },
    {
        id: 'classical',
        label: 'Classical',
        time: '30 min',
        description: 'Deep analysis',
        icon: (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172" />
            </svg>
        ),
    },
];

// Feature card component
const FeatureCard = ({ icon, title, description }: { icon: ReactNode; title: string; description: string }) => (
    <div className="group rounded-2xl border border-border/50 bg-card/50 p-6 text-center transition-all duration-200 hover:border-primary/30 hover:bg-card">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110">
            {icon}
        </div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
);

export default function PlayPage() {
    const router = useRouter();
    const { isQueueing, timeControl, error, joinQueue, leaveQueue, setTimeControl } = useMatchmaking();

    const selectedControl = TIME_CONTROLS.find((t) => t.id === timeControl);

    return (
        <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
            {/* Header */}
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    <span className="text-gradient">Play Chess</span>
                </h1>
                <p className="mt-3 text-lg text-muted-foreground">Choose a time control and find an opponent</p>
            </div>

            {/* Time Control Selection */}
            <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {TIME_CONTROLS.map((tc) => (
                    <button
                        key={tc.id}
                        type="button"
                        disabled={isQueueing}
                        onClick={() => setTimeControl(tc.id)}
                        className={cn(
                            'group relative flex flex-col items-center rounded-2xl border-2 p-5 transition-all duration-200',
                            timeControl === tc.id
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-border bg-card hover:border-primary/50 hover:bg-card/80',
                            isQueueing && 'cursor-not-allowed opacity-50'
                        )}
                        aria-pressed={timeControl === tc.id}
                    >
                        <div
                            className={cn(
                                'mb-3 rounded-xl p-2.5 transition-colors',
                                timeControl === tc.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                            )}
                        >
                            {tc.icon}
                        </div>
                        <div
                            className={cn(
                                'mb-1 text-2xl font-bold tabular-nums',
                                timeControl === tc.id ? 'text-primary' : 'text-foreground'
                            )}
                        >
                            {tc.time}
                        </div>
                        <div className={cn('text-sm font-medium', timeControl === tc.id ? 'text-primary' : 'text-foreground')}>
                            {tc.label}
                        </div>
                        <div className="mt-1.5 text-xs text-muted-foreground">{tc.description}</div>
                        {timeControl === tc.id && (
                            <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-lg">
                                <svg className="h-3.5 w-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Play Button / Queue Status */}
            <div className="flex flex-col items-center gap-6">
                {isQueueing ? (
                    <div className="flex flex-col items-center gap-6 rounded-2xl border border-primary/30 bg-primary/5 p-8">
                        {/* Searching Animation */}
                        <div className="relative">
                            <div className="h-28 w-28 animate-spin rounded-full border-4 border-primary/20 border-t-primary" style={{ animationDuration: '1.5s' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-20 w-20 animate-pulse rounded-full bg-primary/10" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-semibold">Finding opponent...</p>
                            <p className="mt-1 text-muted-foreground">
                                Searching for <span className="font-medium text-primary">{selectedControl?.label}</span> game ({selectedControl?.time})
                            </p>
                        </div>
                        <Button type="button" variant="outline" size="lg" onClick={leaveQueue} className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                        className="group h-16 gap-3 rounded-2xl bg-primary px-14 text-lg font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                    >
                        <svg
                            className="h-6 w-6 transition-transform duration-200 group-hover:scale-110"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                            />
                        </svg>
                        Play {selectedControl?.label}
                    </Button>
                )}

                {error && (
                    <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-400">
                        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                        {error}
                    </div>
                )}
            </div>

            {/* Quick Info */}
            <div className="mt-16 grid gap-4 sm:grid-cols-3">
                <FeatureCard
                    icon={
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                        </svg>
                    }
                    title="Instant Matching"
                    description="Find opponents at your skill level in seconds"
                />
                <FeatureCard
                    icon={
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                            />
                        </svg>
                    }
                    title="Rated Games"
                    description="Earn rating points and climb the leaderboard"
                />
                <FeatureCard
                    icon={
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                        </svg>
                    }
                    title="Quick Rematch"
                    description="Challenge the same opponent again instantly"
                />
            </div>

            {/* Play vs Bot Section */}
            <div className="mt-12">
                <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-6">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-lg">
                                🤖
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Play vs Bot</h3>
                                <p className="text-sm text-muted-foreground">Practice offline against AI with 5 difficulty levels</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-500">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Works Offline
                            </span>
                            <Button
                                onClick={() => router.push('/play/bot')}
                                variant="outline"
                                className="gap-2"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                </svg>
                                Play Bot
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
