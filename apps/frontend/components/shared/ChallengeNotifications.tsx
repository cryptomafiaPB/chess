'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useChallenge, IncomingChallenge, TimeControl } from '@/features/game/hooks/useChallenge';

const timeControlLabels: Record<TimeControl, { label: string; icon: string }> = {
    bullet: { label: 'Bullet', icon: '⚡' },
    blitz: { label: 'Blitz', icon: '🔥' },
    rapid: { label: 'Rapid', icon: '⏱️' },
    classical: { label: 'Classical', icon: '♟️' },
};

interface ChallengeNotificationProps {
    challenge: IncomingChallenge;
    onAccept: (challengeId: string) => void;
    onDecline: (challengeId: string) => void;
}

function ChallengeNotification({ challenge, onAccept, onDecline }: ChallengeNotificationProps) {
    const [countdown, setCountdown] = useState<number>(60);

    useEffect(() => {
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((challenge.expiresAt - Date.now()) / 1000));
            setCountdown(remaining);
        }, 1000);

        return () => clearInterval(interval);
    }, [challenge.expiresAt]);

    const tcInfo = timeControlLabels[challenge.timeControl];

    return (
        <div className="w-[calc(100vw-2rem)] max-w-80 animate-slide-in-right overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-emerald-500/10 md:w-80">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⚔️</span>
                        <span className="font-semibold text-white">Challenge!</span>
                    </div>
                    <div className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-sm font-medium text-emerald-400">
                        {countdown}s
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-4">
                <div className="mb-3 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 p-0.5">
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                            {challenge.challengerUsername?.charAt(0).toUpperCase() || '?'}
                        </div>
                    </div>
                    <div>
                        <div className="font-medium text-white">
                            {challenge.challengerUsername || `User #${challenge.challengerId}`}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                            <span>{tcInfo.icon}</span>
                            <span>{tcInfo.label}</span>
                        </div>
                    </div>
                </div>

                <p className="mb-4 text-sm text-slate-400">
                    wants to play a {tcInfo.label.toLowerCase()} game with you!
                </p>

                <div className="flex gap-2">
                    <Button
                        onClick={() => onDecline(challenge.challengeId)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-slate-600 hover:bg-slate-800"
                    >
                        Decline
                    </Button>
                    <Button
                        onClick={() => onAccept(challenge.challengeId)}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold text-white hover:from-emerald-600 hover:to-cyan-600"
                    >
                        Accept
                    </Button>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-slate-800">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000"
                    style={{ width: `${(countdown / 60) * 100}%` }}
                />
            </div>
        </div>
    );
}

export function ChallengeNotifications() {
    const { incomingChallenges, acceptChallenge, declineChallenge } = useChallenge();

    if (incomingChallenges.length === 0) return null;

    return (
        <div className="fixed left-1/2 top-16 z-[100] flex -translate-x-1/2 flex-col gap-3 md:left-auto md:right-4 md:top-20 md:translate-x-0">
            {incomingChallenges.map((challenge) => (
                <ChallengeNotification
                    key={challenge.challengeId}
                    challenge={challenge}
                    onAccept={acceptChallenge}
                    onDecline={declineChallenge}
                />
            ))}
        </div>
    );
}
