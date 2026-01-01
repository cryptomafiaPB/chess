// app/(dashboard)/play/bot/page.tsx
// Bot play setup page - select difficulty and color

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DifficultySelector } from '@/components/game/DifficultySelector';
import { BotAvatar } from '@/components/game/BotAvatar';
import { BOT_CONFIGS, type BotDifficulty } from '@/lib/chess/bot';
import { cn } from '@/lib/utils';

type PlayerColor = 'white' | 'black' | 'random';

export default function PlayBotPage() {
    const router = useRouter();
    const [difficulty, setDifficulty] = useState<BotDifficulty>(3);
    const [playerColor, setPlayerColor] = useState<PlayerColor>('white');

    const handleStartGame = () => {
        // Resolve random color
        const resolvedColor = playerColor === 'random'
            ? (Math.random() < 0.5 ? 'white' : 'black')
            : playerColor;

        // Navigate to bot game page with settings in URL
        router.push(`/game/bot?difficulty=${difficulty}&color=${resolvedColor}`);
    };

    return (
        <div className="mx-auto max-w-2xl px-4 py-6 lg:py-8">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="mb-4 inline-flex items-center justify-center">
                    <BotAvatar difficulty={difficulty} size="lg" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    <span className="text-gradient">Play vs Bot</span>
                </h1>
                <p className="mt-3 text-lg text-muted-foreground">
                    Practice offline against our chess bot
                </p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-500">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Works offline
                </div>
            </div>

            {/* Color Selection */}
            <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold">Choose Your Color</h2>
                <div className="grid grid-cols-3 gap-3">
                    {(['white', 'random', 'black'] as const).map((color) => {
                        const isSelected = playerColor === color;
                        return (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setPlayerColor(color)}
                                className={cn(
                                    'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200',
                                    isSelected
                                        ? 'border-primary bg-primary/10 shadow-lg'
                                        : 'border-border bg-card hover:border-primary/50'
                                )}
                            >
                                <div className={cn(
                                    'flex h-12 w-12 items-center justify-center rounded-lg',
                                    color === 'white' && 'bg-white shadow-md',
                                    color === 'black' && 'bg-slate-800',
                                    color === 'random' && 'bg-gradient-to-br from-white to-slate-800'
                                )}>
                                    {color === 'white' && (
                                        <svg viewBox="0 0 45 45" className="h-8 w-8">
                                            <g fill="#fff" stroke="#000" strokeWidth="1.5">
                                                <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
                                            </g>
                                        </svg>
                                    )}
                                    {color === 'black' && (
                                        <svg viewBox="0 0 45 45" className="h-8 w-8">
                                            <g fill="#1e293b" stroke="#000" strokeWidth="1.5">
                                                <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
                                            </g>
                                        </svg>
                                    )}
                                    {color === 'random' && (
                                        <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                                        </svg>
                                    )}
                                </div>
                                <span className={cn(
                                    'text-sm font-medium capitalize',
                                    isSelected ? 'text-primary' : 'text-foreground'
                                )}>
                                    {color}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Difficulty Selection */}
            <div className="mb-8">
                <h2 className="mb-4 text-lg font-semibold">Select Difficulty</h2>
                <DifficultySelector
                    selected={difficulty}
                    onSelect={setDifficulty}
                />
            </div>

            {/* Start Game Button */}
            <Button
                type="button"
                size="lg"
                onClick={handleStartGame}
                className="group h-14 w-full gap-3 rounded-xl bg-primary text-lg font-semibold shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
            >
                <svg
                    className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
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
                Start Game vs {BOT_CONFIGS[difficulty].name} Bot
            </Button>

            {/* Info Cards */}
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-primary">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                        <span className="font-medium">Instant Play</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        No waiting for opponents. Start playing immediately.
                    </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-green-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                        </svg>
                        <span className="font-medium">Works Offline</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Play anytime, anywhere. No internet required.
                    </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-yellow-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        <span className="font-medium">Undo Moves</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Made a mistake? Undo and try a different approach.
                    </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-blue-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                        </svg>
                        <span className="font-medium">5 Difficulty Levels</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        From beginner-friendly to expert challenge.
                    </p>
                </div>
            </div>

            {/* Back Link */}
            <div className="mt-8 text-center">
                <button
                    type="button"
                    onClick={() => router.push('/play')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to Play Options
                </button>
            </div>
        </div>
    );
}
