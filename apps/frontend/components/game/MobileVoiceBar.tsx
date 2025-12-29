'use client';

import React from 'react';
import { RefObject } from 'react';

type VoiceState = 'idle' | 'connecting' | 'active' | 'error';

interface Props {
    voiceState: VoiceState;
    error?: string | null;
    isMutedLocal: boolean;
    isMutedRemote: boolean;
    canUseVoice: boolean;
    onStart: () => void;
    onStop: () => void;
    onToggleMute: () => void;
    remoteAudioRef: RefObject<HTMLAudioElement>;
}

export function MobileVoiceBar({
    voiceState,
    error,
    isMutedLocal,
    isMutedRemote,
    canUseVoice,
    onStart,
    onStop,
    onToggleMute,
    remoteAudioRef,
}: Props) {
    const disabled = !canUseVoice;

    if (voiceState === 'idle') {
        return (
            <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg p-2">
                <button
                    onClick={onStart}
                    disabled={disabled}
                    className={`
                        flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
                        ${disabled
                            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                            : 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 active:scale-95'}
                    `}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Push to Talk
                </button>
                <audio ref={remoteAudioRef} hidden />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-slate-800/80 rounded-lg p-2">
            {/* Mute Mic button */}
            <button
                onClick={onToggleMute}
                className={`
                    flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-medium transition-all
                    ${isMutedLocal
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}
                `}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {isMutedLocal ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    )}
                </svg>
                {isMutedLocal ? 'Muted' : 'Mute Mic'}
            </button>

            {/* Deafen button (visual only - mutes remote) */}
            <button
                className={`
                    flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-medium transition-all
                    ${isMutedRemote
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'}
                `}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {isMutedRemote ? (
                        <>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </>
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    )}
                </svg>
                Deafen
            </button>

            {/* Push to Talk / Active indicator */}
            <div className="flex-1 flex items-center justify-center">
                {voiceState === 'connecting' ? (
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Connecting...
                    </div>
                ) : voiceState === 'active' ? (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Voice Active
                    </div>
                ) : null}
            </div>

            {/* Leave button */}
            {voiceState === 'active' && (
                <button
                    onClick={onStop}
                    className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Leave
                </button>
            )}

            {error && (
                <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-red-500/20 text-red-400 text-xs rounded-lg">
                    {error}
                </div>
            )}

            <audio ref={remoteAudioRef} hidden />
        </div>
    );
}
