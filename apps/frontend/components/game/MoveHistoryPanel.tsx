'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
    ListOrdered,
    Clock,
    ChevronFirst,
    ChevronLast,
    ChevronLeft,
    ChevronRight,
    Sparkles
} from 'lucide-react';

interface MoveEntry {
    moveNumber: number;
    white?: { san: string; from: string; to: string };
    black?: { san: string; from: string; to: string };
}

interface Props {
    moves: MoveEntry[];
    currentMoveIndex?: number;
    onNavigate?: (index: number) => void;
    openingName?: string;
    showControls?: boolean;
}

export function MoveHistoryPanel({ moves, currentMoveIndex, onNavigate, openingName, showControls = false }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest move
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [moves.length]);

    return (
        <div className="flex flex-col h-full bg-card/50 rounded-xl overflow-hidden border border-border/30">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30 bg-card/30">
                <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Moves</span>
                </div>
                {openingName && (
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-xs text-primary/80 truncate max-w-[150px] font-medium" title={openingName}>
                            {openingName}
                        </span>
                    </div>
                )}
            </div>

            {/* Move list */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            >
                {moves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm py-8">
                        <Clock className="w-10 h-10 mb-3 opacity-40" />
                        <span className="text-muted-foreground/70">Waiting for first move...</span>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {moves.map((move, idx) => (
                            <div
                                key={move.moveNumber}
                                className="flex items-center text-sm rounded-lg hover:bg-muted/50 transition-all"
                            >
                                {/* Move number */}
                                <span className="w-8 px-2 py-1.5 text-muted-foreground font-medium text-right shrink-0 text-xs">
                                    {move.moveNumber}.
                                </span>

                                {/* White's move */}
                                <button
                                    onClick={() => onNavigate?.(idx * 2)}
                                    disabled={!showControls}
                                    className={cn(
                                        'flex-1 px-2 py-1.5 text-left font-mono text-[13px] transition-all rounded-l-lg',
                                        currentMoveIndex === idx * 2
                                            ? 'bg-primary/20 text-primary font-semibold'
                                            : 'text-foreground hover:bg-muted/70',
                                        !showControls && 'cursor-default'
                                    )}
                                >
                                    {move.white?.san ?? '...'}
                                </button>

                                {/* Black's move */}
                                <button
                                    onClick={() => onNavigate?.(idx * 2 + 1)}
                                    disabled={!showControls}
                                    className={cn(
                                        'flex-1 px-2 py-1.5 text-left font-mono text-[13px] transition-all rounded-r-lg',
                                        currentMoveIndex === idx * 2 + 1
                                            ? 'bg-primary/20 text-primary font-semibold'
                                            : 'text-foreground hover:bg-muted/70',
                                        !move.black && 'invisible',
                                        !showControls && 'cursor-default'
                                    )}
                                >
                                    {move.black?.san ?? ''}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation controls - only shown for bot games */}
            {showControls && (
                <div className="flex items-center justify-center gap-1 px-2 py-2 border-t border-border/30 bg-card/30">
                    <button
                        onClick={() => onNavigate?.(0)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                        title="First move"
                    >
                        <ChevronFirst className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onNavigate?.((currentMoveIndex ?? 0) - 1)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                        title="Previous move"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onNavigate?.((currentMoveIndex ?? 0) + 1)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                        title="Next move"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onNavigate?.(moves.length * 2 - 1)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                        title="Last move"
                    >
                        <ChevronLast className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
