// components/game/PostGameModal.tsx
'use client';

import { useRematch } from '@/features/game/hooks/useRematch';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
    RefreshCw,
    Users,
    BarChart3,
    Home,
    X,
    Clock,
    Trophy,
    Frown,
    Handshake,
    Eye,
    Flag
} from 'lucide-react';

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
        if (result === 'white_wins' && role === 'white') return { text: 'Victory!', Icon: Trophy, color: 'text-primary', bgColor: 'bg-primary/20' };
        if (result === 'black_wins' && role === 'black') return { text: 'Victory!', Icon: Trophy, color: 'text-primary', bgColor: 'bg-primary/20' };
        if (result === 'white_wins' && role === 'black') return { text: 'Defeat', Icon: Frown, color: 'text-destructive', bgColor: 'bg-destructive/20' };
        if (result === 'black_wins' && role === 'white') return { text: 'Defeat', Icon: Frown, color: 'text-destructive', bgColor: 'bg-destructive/20' };
        if (result === 'draw') return { text: 'Draw', Icon: Handshake, color: 'text-amber-500', bgColor: 'bg-amber-500/20' };
        if (role === 'spectator') return { text: 'Game Over', Icon: Eye, color: 'text-muted-foreground', bgColor: 'bg-muted' };
        return { text: 'Game Over', Icon: Flag, color: 'text-muted-foreground', bgColor: 'bg-muted' };
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
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Result Header */}
                <div className="relative px-6 pt-8 pb-6 text-center">
                    <div className={cn(
                        'w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center',
                        resultDisplay.bgColor
                    )}>
                        <resultDisplay.Icon className={cn('w-10 h-10', resultDisplay.color)} />
                    </div>
                    <h2 className={cn('text-2xl font-bold', resultDisplay.color)}>
                        {resultDisplay.text}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {getReasonDisplay()}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-4 mb-4 px-3 py-2 bg-destructive/20 text-destructive text-sm rounded-xl">
                        {error}
                    </div>
                )}

                {/* Rematch Section */}
                <div className="px-4 pb-4 space-y-3">
                    {/* Rematch Requested by You */}
                    {rematchState.isRequested && (
                        <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                            <div className="flex items-center justify-center gap-2 text-primary mb-3">
                                <Clock className="w-4 h-4 animate-pulse" />
                                <p className="text-sm font-medium">
                                    Waiting for opponent...
                                    {timeRemaining !== null && (
                                        <span className="ml-1 font-mono">({timeRemaining}s)</span>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={cancelRematch}
                                disabled={isLoading}
                                className="w-full py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-all"
                            >
                                Cancel Request
                            </button>
                        </div>
                    )}

                    {/* Rematch Offered to You */}
                    {rematchState.isOffered && (
                        <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                            <div className="flex items-center justify-center gap-2 text-primary mb-3">
                                <RefreshCw className="w-4 h-4" />
                                <p className="text-sm font-medium">
                                    Opponent wants a rematch!
                                    {timeRemaining !== null && (
                                        <span className="ml-1 font-mono">({timeRemaining}s)</span>
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={acceptRematch}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={declineRematch}
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-all"
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
                            className="w-full py-3.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Rematch
                        </button>
                    )}

                    <button
                        onClick={handleNewOpponent}
                        className="w-full py-3 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Users className="w-5 h-5" />
                        New Opponent
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={handleAnalyze}
                            className="flex-1 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-card hover:bg-muted/50 border border-border/50 rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Analyze
                        </button>
                        <button
                            onClick={handleBackToDashboard}
                            className="flex-1 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-card hover:bg-muted/50 border border-border/50 rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                            <Home className="w-4 h-4" />
                            Home
                        </button>
                    </div>
                </div>

                {/* Close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
