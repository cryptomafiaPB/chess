'use client';

import React from 'react';

interface Props {
    onOfferDraw: () => void;
    onResign: () => void;
    disabled?: boolean;
    drawOffered?: boolean;
}

export function GameActionButtons({ onOfferDraw, onResign, disabled, drawOffered }: Props) {
    return (
        <div className="flex flex-col gap-2">
            {/* Offer Draw */}
            <button
                onClick={onOfferDraw}
                disabled={disabled || drawOffered}
                className={`
                    flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-all
                    ${disabled || drawOffered
                        ? 'bg-slate-700/30 text-slate-600 cursor-not-allowed'
                        : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 active:scale-95'}
                `}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {drawOffered ? 'Draw Offered' : 'Offer Draw'}
            </button>

            {/* Resign */}
            <button
                onClick={onResign}
                disabled={disabled}
                className={`
                    flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-all
                    ${disabled
                        ? 'bg-slate-700/30 text-slate-600 cursor-not-allowed'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 active:scale-95'}
                `}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Resign
            </button>
        </div>
    );
}
