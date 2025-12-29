'use client';

import React, { useState, useRef, useEffect } from 'react';

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
            <div className="flex items-center h-10 px-3 bg-slate-800/80 rounded-lg text-slate-400 text-sm">
                No moves yet
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg overflow-hidden">
            {/* Left scroll button */}
            <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`
                    shrink-0 p-2 transition-colors
                    ${canScrollLeft ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 cursor-default'}
                `}
                aria-label="Scroll left"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
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
                        <span className="text-[11px] text-slate-500 font-medium min-w-5">
                            {move.moveNumber}.
                        </span>
                        {/* White's move */}
                        {move.white && (
                            <button
                                onClick={() => onNavigate?.(idx * 2)}
                                className={`
                                    px-2 py-1 rounded text-xs font-medium transition-colors
                                    ${currentMoveIndex === idx * 2
                                        ? 'bg-sky-500/30 text-sky-300'
                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}
                                `}
                            >
                                {move.white.san}
                            </button>
                        )}
                        {/* Black's move */}
                        {move.black && (
                            <button
                                onClick={() => onNavigate?.(idx * 2 + 1)}
                                className={`
                                    px-2 py-1 rounded text-xs font-medium transition-colors
                                    ${currentMoveIndex === idx * 2 + 1
                                        ? 'bg-sky-500/30 text-sky-300'
                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}
                                `}
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
                className={`
                    shrink-0 p-2 transition-colors
                    ${canScrollRight ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 cursor-default'}
                `}
                aria-label="Scroll right"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
    );
}
