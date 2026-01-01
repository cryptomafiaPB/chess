// components/game/BotAvatar.tsx
// Bot player avatar component

'use client';

import { cn } from '@/lib/utils';
import type { BotDifficulty } from '@/lib/chess/bot';

interface BotAvatarProps {
    difficulty: BotDifficulty;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    isThinking?: boolean;
}

const difficultyColors: Record<BotDifficulty, string> = {
    1: 'from-green-400 to-green-600',
    2: 'from-blue-400 to-blue-600',
    3: 'from-yellow-400 to-yellow-600',
    4: 'from-orange-400 to-orange-600',
    5: 'from-red-400 to-red-600',
};

const difficultyIcons: Record<BotDifficulty, string> = {
    1: '🤖',
    2: '🤖',
    3: '🤖',
    4: '🤖',
    5: '🤖',
};

const sizeClasses = {
    sm: 'h-8 w-8 text-base',
    md: 'h-12 w-12 text-xl',
    lg: 'h-16 w-16 text-2xl',
};

export function BotAvatar({ difficulty, size = 'md', className, isThinking }: BotAvatarProps) {
    return (
        <div
            className={cn(
                'relative flex items-center justify-center rounded-full bg-gradient-to-br shadow-lg',
                difficultyColors[difficulty],
                sizeClasses[size],
                className
            )}
        >
            <span className={cn('transition-transform', isThinking && 'animate-pulse')}>
                {difficultyIcons[difficulty]}
            </span>

            {/* Difficulty indicator */}
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-bold shadow-md">
                {difficulty}
            </div>

            {/* Thinking indicator */}
            {isThinking && (
                <div className="absolute -inset-1 animate-ping rounded-full bg-primary/30" />
            )}
        </div>
    );
}

export function BotInfo({
    difficulty,
    name,
    isThinking,
    className
}: {
    difficulty: BotDifficulty;
    name: string;
    isThinking?: boolean;
    className?: string;
}) {
    return (
        <div className={cn('flex items-center gap-3', className)}>
            <BotAvatar difficulty={difficulty} isThinking={isThinking} />
            <div>
                <div className="font-semibold">{name}</div>
                <div className="text-sm text-muted-foreground">
                    {isThinking ? (
                        <span className="flex items-center gap-1">
                            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
                            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
                            <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
                            <span className="ml-1">Thinking</span>
                        </span>
                    ) : (
                        `Level ${difficulty} Bot`
                    )}
                </div>
            </div>
        </div>
    );
}
