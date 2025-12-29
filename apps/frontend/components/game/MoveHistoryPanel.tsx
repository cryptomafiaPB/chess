'use client';

import React, { useRef, useEffect } from 'react';

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
    showControls?: boolean; // Only show controls for bot games
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
        <div className="flex flex-col h-full bg-[#262522] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#3d3a37]">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-sm font-medium text-slate-200">Moves</span>
                </div>
                {openingName && (
                    <span className="text-xs text-amber-400/80 truncate max-w-[150px]" title={openingName}>
                        {openingName}
                    </span>
                )}
            </div>

            {/* Move list */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-[#3d3a37] scrollbar-track-transparent"
            >
                {moves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm py-8">
                        <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-slate-400">Waiting for first move...</span>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {moves.map((move, idx) => (
                            <div
                                key={move.moveNumber}
                                className="flex items-center text-sm rounded hover:bg-[#3d3a37]/50 transition-colors"
                            >
                                {/* Move number */}
                                <span className="w-8 px-2 py-1.5 text-slate-500 font-medium text-right shrink-0 text-xs">
                                    {move.moveNumber}.
                                </span>

                                {/* White's move */}
                                <button
                                    onClick={() => onNavigate?.(idx * 2)}
                                    disabled={!showControls}
                                    className={`
                                        flex-1 px-2 py-1.5 text-left font-mono text-[13px] transition-colors rounded-l
                                        ${currentMoveIndex === idx * 2
                                            ? 'bg-amber-500/20 text-amber-300'
                                            : 'text-slate-200 hover:bg-[#3d3a37]/70'}
                                        ${!showControls ? 'cursor-default' : ''}
                                    `}
                                >
                                    {move.white?.san ?? '...'}
                                </button>

                                {/* Black's move */}
                                <button
                                    onClick={() => onNavigate?.(idx * 2 + 1)}
                                    disabled={!showControls}
                                    className={`
                                        flex-1 px-2 py-1.5 text-left font-mono text-[13px] transition-colors rounded-r
                                        ${currentMoveIndex === idx * 2 + 1
                                            ? 'bg-amber-500/20 text-amber-300'
                                            : 'text-slate-200 hover:bg-[#3d3a37]/70'}
                                        ${!move.black ? 'invisible' : ''}
                                        ${!showControls ? 'cursor-default' : ''}
                                    `}
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
                <div className="flex items-center justify-center gap-1 px-2 py-2 border-t border-[#3d3a37]">
                    <button
                        onClick={() => onNavigate?.(0)}
                        className="p-1.5 rounded hover:bg-[#3d3a37] text-slate-400 hover:text-white transition-colors"
                        title="First move"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onNavigate?.((currentMoveIndex ?? 0) - 1)}
                        className="p-1.5 rounded hover:bg-[#3d3a37] text-slate-400 hover:text-white transition-colors"
                        title="Previous move"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onNavigate?.((currentMoveIndex ?? 0) + 1)}
                        className="p-1.5 rounded hover:bg-[#3d3a37] text-slate-400 hover:text-white transition-colors"
                        title="Next move"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onNavigate?.(moves.length * 2 - 1)}
                        className="p-1.5 rounded hover:bg-[#3d3a37] text-slate-400 hover:text-white transition-colors"
                        title="Last move"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
