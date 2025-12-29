'use client';

import { Button } from '@/components/ui/button';
import { RefObject } from 'react';

type Props = {
    voiceState: 'idle' | 'connecting' | 'active' | 'error';
    error?: string | null;
    isMutedLocal: boolean;
    isMutedRemote: boolean;
    localLevel?: number;
    remoteLevel?: number;
    canUseVoice: boolean;
    onStart: () => void;
    onStop: () => void;
    onToggleMute: () => void;
    remoteAudioRef: RefObject<HTMLAudioElement | null>;
};

export function VoiceControls({
    voiceState,
    error,
    isMutedLocal,
    isMutedRemote,
    localLevel = 0,
    remoteLevel = 0,
    canUseVoice,
    onStart,
    onStop,
    onToggleMute,
    remoteAudioRef,
}: Props) {
    const disabled = !canUseVoice;

    return (
        <div className="flex flex-col gap-2 rounded-md border bg-card p-3 text-sm">
            <div className="mb-1 font-medium">Voice chat</div>

            <div className="flex flex-wrap gap-2">
                {voiceState === 'idle' && (
                    <Button
                        size="sm"
                        onClick={onStart}
                        disabled={disabled}
                    >
                        Join voice
                    </Button>
                )}
                {voiceState === 'connecting' && (
                    <Button
                        size="sm"
                        disabled
                    >
                        Connecting…
                    </Button>
                )}
                {voiceState === 'active' && (
                    <>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onToggleMute}
                        >
                            {isMutedLocal ? 'Unmute' : 'Mute'}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={onStop}
                        >
                            Leave
                        </Button>
                    </>
                )}
            </div>

            <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Remote: {isMutedRemote ? 'Muted' : 'Speaking'}</span>
                <span>Status: {voiceState}</span>
            </div>

            {error && (
                <p className="text-[11px] text-red-500">{error}</p>
            )}

            <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="w-10">You</span>
                    <div className="h-2 flex-1 rounded bg-muted">
                        <div
                            className="h-2 rounded bg-emerald-500 transition-all"
                            style={{ width: `${Math.min(100, localLevel * 100)}%` }}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="w-10">Them</span>
                    <div className="h-2 flex-1 rounded bg-muted">
                        <div
                            className="h-2 rounded bg-sky-500 transition-all"
                            style={{ width: `${Math.min(100, remoteLevel * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            <audio ref={remoteAudioRef} hidden />
        </div>
    );
}
