// components/game/DifficultySelector.tsx
// Bot difficulty selection component

'use client';

import { cn } from '@/lib/utils';
import { BOT_CONFIGS, type BotDifficulty } from '@/lib/chess/bot';
import { BotAvatar } from './BotAvatar';

interface DifficultySelectorProps {
    selected: BotDifficulty;
    onSelect: (difficulty: BotDifficulty) => void;
    disabled?: boolean;
}

const difficultyLevels: BotDifficulty[] = [1, 2, 3, 4, 5];

export function DifficultySelector({ selected, onSelect, disabled }: DifficultySelectorProps) {
    return (
        <div className="grid gap-3">
            {difficultyLevels.map((level) => {
                const config = BOT_CONFIGS[level];
                const isSelected = selected === level;

                return (
                    <button
                        key={level}
                        type="button"
                        onClick={() => onSelect(level)}
                        disabled={disabled}
                        className={cn(
                            'flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200',
                            isSelected
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-border bg-card hover:border-primary/50 hover:bg-card/80',
                            disabled && 'cursor-not-allowed opacity-50'
                        )}
                    >
                        <BotAvatar difficulty={level} size="md" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    'font-semibold',
                                    isSelected ? 'text-primary' : 'text-foreground'
                                )}>
                                    {config.name}
                                </span>
                                <DifficultyStars level={level} />
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {config.description}
                            </p>
                        </div>
                        {isSelected && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                                <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

function DifficultyStars({ level }: { level: BotDifficulty }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <svg
                    key={i}
                    className={cn(
                        'h-3.5 w-3.5',
                        i < level ? 'text-yellow-500' : 'text-muted-foreground/30'
                    )}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

// Compact version for in-game display
export function DifficultyBadge({ difficulty }: { difficulty: BotDifficulty }) {
    const config = BOT_CONFIGS[difficulty];

    return (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            <span>🤖</span>
            <span>{config.name}</span>
            <DifficultyStars level={difficulty} />
        </div>
    );
}
