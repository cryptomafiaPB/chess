'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChallenge, TimeControl } from '@/features/game/hooks/useChallenge';

interface ChallengeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    friendId: string;
    friendUsername: string;
}

const timeControls: { id: TimeControl; label: string; icon: string; time: string }[] = [
    { id: 'bullet', label: 'Bullet', icon: '⚡', time: '1+0' },
    { id: 'blitz', label: 'Blitz', icon: '🔥', time: '3+2' },
    { id: 'rapid', label: 'Rapid', icon: '⏱️', time: '10+5' },
    { id: 'classical', label: 'Classical', icon: '♟️', time: '30+0' },
];

export function ChallengeDialog({ isOpen, onClose, friendId, friendUsername }: ChallengeDialogProps) {
    const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>('blitz');
    const { sendChallenge, outgoingChallenge, isSending, error, cancelChallenge } = useChallenge();
    const [countdown, setCountdown] = useState<number>(60);

    // Handle countdown for outgoing challenge
    useEffect(() => {
        if (!outgoingChallenge) {
            setCountdown(60);
            return;
        }

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((outgoingChallenge.expiresAt - Date.now()) / 1000));
            setCountdown(remaining);
            if (remaining === 0) {
                onClose();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [outgoingChallenge, onClose]);

    const handleSend = () => {
        sendChallenge(friendId, selectedTimeControl);
    };

    const handleCancel = () => {
        cancelChallenge();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={outgoingChallenge ? undefined : onClose}
            />

            {/* Dialog */}
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl">
                {outgoingChallenge ? (
                    // Waiting for response
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 p-4">
                            <svg className="h-full w-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-xl font-bold text-white">Challenge Sent!</h3>
                        <p className="mb-4 text-slate-400">
                            Waiting for <span className="text-emerald-400">{friendUsername}</span> to respond...
                        </p>
                        <div className="mb-6 text-3xl font-bold text-emerald-400">{countdown}s</div>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            className="border-slate-600 hover:bg-slate-800"
                        >
                            Cancel Challenge
                        </Button>
                    </div>
                ) : (
                    // Select time control
                    <>
                        <div className="mb-6 text-center">
                            <h3 className="mb-1 text-xl font-bold text-white">Challenge {friendUsername}</h3>
                            <p className="text-sm text-slate-400">Select a time control</p>
                        </div>

                        {error && (
                            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="mb-6 grid grid-cols-2 gap-3">
                            {timeControls.map((tc) => (
                                <button
                                    key={tc.id}
                                    onClick={() => setSelectedTimeControl(tc.id)}
                                    className={cn(
                                        'flex flex-col items-center gap-1 rounded-xl border p-4 transition-all',
                                        selectedTimeControl === tc.id
                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                            : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                                    )}
                                >
                                    <span className="text-2xl">{tc.icon}</span>
                                    <span className="font-medium">{tc.label}</span>
                                    <span className="text-xs text-slate-500">{tc.time}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 border-slate-600 hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={isSending}
                                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 font-semibold text-white hover:from-emerald-600 hover:to-cyan-600"
                            >
                                {isSending ? 'Sending...' : 'Send Challenge'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
