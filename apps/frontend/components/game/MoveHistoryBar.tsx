'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface MoveEntry {
    moveNumber: number;
    white?: { san: string; from: string; to: string };
    black?: { san: string; from: string; to: string };
}

interface Props {
    moves: MoveEntry[];
    currentMoveIndex?: number;
    onNavigate?: (index: number) => void;
}

export function MoveHistoryBar({ moves, currentMoveIndex, onNavigate }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Auto-scroll to latest move
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [moves.length]);

    const updateScrollState = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    };

    useEffect(() => {
        updateScrollState();
        const ref = scrollRef.current;
        if (ref) {
            ref.addEventListener('scroll', updateScrollState);
            return () => ref.removeEventListener('scroll', updateScrollState);
        }
    }, [moves]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const scrollAmount = 120;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    if (moves.length === 0) {
        return (
            <div className="flex items-center gap-2 h-10 px-3 bg-card/80 border border-border/50 rounded-xl text-muted-foreground text-sm backdrop-blur-sm">
                <Clock className="w-4 h-4" />
                <span>Waiting for first move...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 bg-card/80 border border-border/50 rounded-xl overflow-hidden backdrop-blur-sm">
            {/* Left scroll button */}
            <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={cn(
                    'shrink-0 p-2 transition-all rounded-lg',
                    canScrollLeft
                        ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        : 'text-muted-foreground/30 cursor-default'
                )}
                aria-label="Scroll left"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable moves container */}
            <div
                ref={scrollRef}
                className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {moves.map((move, idx) => (
                    <div key={move.moveNumber} className="flex items-center gap-1 shrink-0">
                        {/* Move number */}
                        <span className="text-[11px] text-muted-foreground font-medium min-w-5">
                            {move.moveNumber}.
                        </span>
                        {/* White's move */}
                        {move.white && (
                            <button
                                onClick={() => onNavigate?.(idx * 2)}
                                className={cn(
                                    'px-2 py-1 rounded-lg text-xs font-medium transition-all',
                                    currentMoveIndex === idx * 2
                                        ? 'bg-primary/20 text-primary font-semibold'
                                        : 'bg-muted/50 text-foreground hover:bg-muted'
                                )}
                            >
                                {move.white.san}
                            </button>
                        )}
                        {/* Black's move */}
                        {move.black && (
                            <button
                                onClick={() => onNavigate?.(idx * 2 + 1)}
                                className={cn(
                                    'px-2 py-1 rounded-lg text-xs font-medium transition-all',
                                    currentMoveIndex === idx * 2 + 1
                                        ? 'bg-primary/20 text-primary font-semibold'
                                        : 'bg-muted/50 text-foreground hover:bg-muted'
                                )}
                            >
                                {move.black.san}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Right scroll button */}
            <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={cn(
                    'shrink-0 p-2 transition-all rounded-lg',
                    canScrollRight
                        ? 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        : 'text-muted-foreground/30 cursor-default'
                )}
                aria-label="Scroll right"
            >
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}
