// components/game/PostGameActions.tsx
'use client';

import { useRematch } from '@/features/game/hooks/useRematch';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface PostGameActionsProps {
    gameId: string;
    result?: string | null;
    resultReason?: string | null;
    role?: 'white' | 'black' | 'spectator';
}

export function PostGameActions({
    gameId,
    result,
    resultReason,
    role
}: PostGameActionsProps) {
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
        router.push('/play');
    };

    // Don't show for spectators
    if (role === 'spectator') {
        return (
            <Card className="p-6 mt-4">
                <div className="space-y-4">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">Game Over</h3>
                        <p className="text-sm text-muted-foreground">
                            {resultReason && `Result: ${resultReason}`}
                        </p>
                    </div>
                    <Button
                        onClick={handleBackToDashboard}
                        className="w-full"
                        variant="outline"
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 mt-4">
            <div className="space-y-4">
                {/* Game Result Header */}
                <div className="text-center border-b pb-4">
                    <h3 className="text-xl font-bold mb-2">
                        {result === 'white_wins' && role === 'white' && '🎉 You Won!'}
                        {result === 'black_wins' && role === 'black' && '🎉 You Won!'}
                        {result === 'white_wins' && role === 'black' && '😞 You Lost'}
                        {result === 'black_wins' && role === 'white' && '😞 You Lost'}
                        {result === 'draw' && '🤝 Draw'}
                        {!result && 'Game Over'}
                    </h3>
                    {resultReason && (
                        <p className="text-sm text-muted-foreground capitalize">
                            {resultReason.replace(/_/g, ' ')}
                        </p>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Rematch Requested by You */}
                {rematchState.isRequested && (
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
                        <p className="text-sm text-center mb-3">
                            ⏳ Waiting for opponent to accept rematch...
                            {timeRemaining && ` (${timeRemaining}s)`}
                        </p>
                        <Button
                            onClick={cancelRematch}
                            disabled={isLoading}
                            variant="outline"
                            className="w-full"
                            size="sm"
                        >
                            Cancel Rematch Request
                        </Button>
                    </div>
                )}

                {/* Rematch Offered to You */}
                {rematchState.isOffered && (
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md space-y-3">
                        <p className="text-sm text-center font-medium">
                            🔄 Opponent wants a rematch!
                            {timeRemaining && ` (${timeRemaining}s)`}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={acceptRematch}
                                disabled={isLoading}
                                className="flex-1"
                                variant="default"
                            >
                                Accept
                            </Button>
                            <Button
                                onClick={declineRematch}
                                disabled={isLoading}
                                className="flex-1"
                                variant="outline"
                            >
                                Decline
                            </Button>
                        </div>
                    </div>
                )}

                {/* Default Actions (No Rematch Pending) */}
                {!rematchState.isRequested && !rematchState.isOffered && (
                    <div className="space-y-2">
                        <Button
                            onClick={requestRematch}
                            disabled={isLoading}
                            className="w-full"
                            variant="default"
                        >
                            🔄 Request Rematch
                        </Button>
                        <Button
                            onClick={handleNewOpponent}
                            disabled={isLoading}
                            className="w-full"
                            variant="outline"
                        >
                            ⚔️ Find New Opponent
                        </Button>
                        <Button
                            onClick={handleBackToDashboard}
                            className="w-full"
                            variant="ghost"
                        >
                            🏠 Back to Dashboard
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
