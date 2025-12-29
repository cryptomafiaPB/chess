// components/game/PostGameModal.tsx
'use client';

import { useRematch } from '@/features/game/hooks/useRematch';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PostGameModalProps {
    gameId: string;
    result?: string | null;
    resultReason?: string | null;
    role?: 'white' | 'black' | 'spectator';
    isOpen: boolean;
    onClose?: () => void;
}

export function PostGameModal({
    gameId,
    result,
    resultReason,
    role,
    isOpen,
    onClose
}: PostGameModalProps) {
    const {
        rematchState,
        requestRematch,
        acceptRematch,
        declineRematch,
        cancelRematch,
        isLoading,
        error
    } = useRematch(gameId);

    const router = useRouter();
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    // Update countdown timer
    useEffect(() => {
        if (!rematchState.expiresAt) {
            setTimeRemaining(null);
            return;
        }

        const interval = setInterval(() => {
            const remaining = Math.max(0, rematchState.expiresAt! - Date.now());
            setTimeRemaining(Math.ceil(remaining / 1000));

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [rematchState.expiresAt]);

    const handleNewOpponent = () => {
        router.push('/play');
    };

    const handleBackToDashboard = () => {
        router.push('/');
    };

    const handleAnalyze = () => {
        // TODO: Implement game analysis
        console.log('Analyze game:', gameId);
    };

    if (!isOpen) return null;

    // Determine result display
    const getResultDisplay = () => {
        if (result === 'white_wins' && role === 'white') return { text: 'Victory!', emoji: '🎉', color: 'text-emerald-400' };
        if (result === 'black_wins' && role === 'black') return { text: 'Victory!', emoji: '🎉', color: 'text-emerald-400' };
        if (result === 'white_wins' && role === 'black') return { text: 'Defeat', emoji: '😞', color: 'text-red-400' };
        if (result === 'black_wins' && role === 'white') return { text: 'Defeat', emoji: '😞', color: 'text-red-400' };
        if (result === 'draw') return { text: 'Draw', emoji: '🤝', color: 'text-amber-400' };
        if (role === 'spectator') return { text: 'Game Over', emoji: '👀', color: 'text-slate-300' };
        return { text: 'Game Over', emoji: '🏁', color: 'text-slate-300' };
    };

    const resultDisplay = getResultDisplay();

    const getReasonDisplay = () => {
        if (!resultReason) return '';
        const reasons: Record<string, string> = {
            checkmate: 'by Checkmate',
            resign: 'by Resignation',
            timeout: 'on Time',
            inactivity: 'by Inactivity',
            draw: 'by Agreement',
            stalemate: 'by Stalemate',
            insufficient_material: 'by Insufficient Material',
            threefold_repetition: 'by Repetition',
            fifty_move_rule: 'by 50-Move Rule'
        };
        return reasons[resultReason] ?? resultReason.replace(/_/g, ' ');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Result Header */}
                <div className="relative px-6 pt-8 pb-6 text-center bg-gradient-to-b from-slate-800/50 to-transparent">
                    <div className="text-5xl mb-3">{resultDisplay.emoji}</div>
                    <h2 className={`text-2xl font-bold ${resultDisplay.color}`}>
                        {resultDisplay.text}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                        {getReasonDisplay()}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-4 mb-4 px-3 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                {/* Rematch Section */}
                <div className="px-4 pb-4 space-y-3">
                    {/* Rematch Requested by You */}
                    {rematchState.isRequested && (
                        <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl">
                            <p className="text-sm text-center text-sky-300 mb-2">
                                ⏳ Waiting for opponent...
                                {timeRemaining !== null && (
                                    <span className="ml-1 font-mono">({timeRemaining}s)</span>
                                )}
                            </p>
                            <button
                                onClick={cancelRematch}
                                disabled={isLoading}
                                className="w-full py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Cancel Request
                            </button>
                        </div>
                    )}

                    {/* Rematch Offered to You */}
                    {rematchState.isOffered && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                            <p className="text-sm text-center text-emerald-300 mb-2">
                                🔄 Opponent wants a rematch!
                                {timeRemaining !== null && (
                                    <span className="ml-1 font-mono">({timeRemaining}s)</span>
                                )}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={acceptRematch}
                                    disabled={isLoading}
                                    className="flex-1 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={declineRematch}
                                    disabled={isLoading}
                                    className="flex-1 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {!rematchState.isRequested && !rematchState.isOffered && role !== 'spectator' && (
                        <button
                            onClick={requestRematch}
                            disabled={isLoading}
                            className="w-full py-3 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Rematch
                        </button>
                    )}

                    <button
                        onClick={handleNewOpponent}
                        className="w-full py-3 text-sm font-medium text-slate-200 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        New Opponent
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={handleAnalyze}
                            className="flex-1 py-2.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analyze
                        </button>
                        <button
                            onClick={handleBackToDashboard}
                            className="flex-1 py-2.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Home
                        </button>
                    </div>
                </div>

                {/* Close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
