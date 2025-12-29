'use client';

import React, { RefObject, useState } from 'react';
import { MoveHistoryPanel } from './MoveHistoryPanel';
import { ChatPanel } from './ChatPanel';
import type { ChatMessage } from '@/features/game/hooks/useChat';
import type { DrawState } from '@/features/game/hooks/useDraw';

interface MoveEntry {
    moveNumber: number;
    white?: { san: string; from: string; to: string };
    black?: { san: string; from: string; to: string };
}

type VoiceState = 'idle' | 'connecting' | 'active' | 'error';
type TabType = 'moves' | 'chat';

interface Props {
    // Move history
    moves: MoveEntry[];
    currentMoveIndex?: number;
    onNavigateMove?: (index: number) => void;
    openingName?: string;

    // Chat
    chatMessages: ChatMessage[];
    onSendMessage: (text: string) => void;
    sendingMessage: boolean;
    myUserId?: string;

    // Voice
    voiceState: VoiceState;
    voiceError?: string | null;
    isMutedLocal: boolean;
    isMutedRemote: boolean;
    canUseVoice: boolean;
    onStartVoice: () => void;
    onStopVoice: () => void;
    onToggleMute: () => void;
    remoteAudioRef: RefObject<HTMLAudioElement | null>;

    // Game actions
    isPlayer: boolean;
    gameOver: boolean;
    myColor?: 'white' | 'black' | null;

    // Draw offer
    drawState?: DrawState;
    onOfferDraw?: () => void;
    onAcceptDraw?: () => void;
    onDeclineDraw?: () => void;

    // Resign
    onResign?: () => void;
}

export function GameSidePanel({
    // Move history
    moves,
    currentMoveIndex,
    onNavigateMove,
    openingName,

    // Chat
    chatMessages,
    onSendMessage,
    sendingMessage,
    myUserId,

    // Voice
    voiceState,
    voiceError,
    isMutedLocal,
    isMutedRemote,
    canUseVoice,
    onStartVoice,
    onStopVoice,
    onToggleMute,
    remoteAudioRef,

    // Game actions
    isPlayer,
    gameOver,
    myColor,

    // Draw
    drawState,
    onOfferDraw,
    onAcceptDraw,
    onDeclineDraw,

    // Resign
    onResign,
}: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('moves');

    const hasDrawOffer = drawState?.offeredBy != null;
    const isDrawOfferedToMe = hasDrawOffer && drawState?.offeredBy !== myColor;
    const didIOfferDraw = hasDrawOffer && drawState?.offeredBy === myColor;

    return (
        <div className="h-full w-full flex flex-col bg-[#262522] rounded-lg overflow-hidden shadow-2xl border border-[#3d3a37]">
            {/* Tab Header */}
            <div className="flex border-b border-[#3d3a37]">
                <button
                    onClick={() => setActiveTab('moves')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'moves'
                        ? 'text-white bg-[#262522] border-b-2 border-amber-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#262522]/50'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Moves
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === 'chat'
                        ? 'text-white bg-[#262522] border-b-2 border-amber-500'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#262522]/50'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Chat
                        {chatMessages.length > 0 && activeTab !== 'chat' && (
                            <span className="absolute top-2 right-3 w-2 h-2 bg-amber-500 rounded-full" />
                        )}
                    </div>
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === 'moves' ? (
                    <div className="h-full p-2">
                        <MoveHistoryPanel
                            moves={moves}
                            currentMoveIndex={currentMoveIndex}
                            onNavigate={onNavigateMove}
                            openingName={openingName}
                            showControls={false}
                        />
                    </div>
                ) : (
                    <div className="h-full">
                        <ChatPanel
                            messages={chatMessages}
                            onSend={onSendMessage}
                            sending={sendingMessage}
                            myUserId={myUserId}
                        />
                    </div>
                )}
            </div>

            {/* Voice Controls */}
            {canUseVoice && (
                <div className="px-3 py-2 border-t border-[#3d3a37]">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            Voice
                        </span>
                        {voiceState === 'idle' ? (
                            <button
                                onClick={onStartVoice}
                                className="ml-auto px-3 py-1 text-xs font-medium bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30 transition-colors"
                            >
                                Connect
                            </button>
                        ) : voiceState === 'connecting' ? (
                            <span className="ml-auto text-xs text-slate-400">Connecting...</span>
                        ) : (
                            <div className="ml-auto flex items-center gap-1.5">
                                <button
                                    onClick={onToggleMute}
                                    className={`p-1.5 rounded transition-colors ${isMutedLocal
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                        }`}
                                    title={isMutedLocal ? 'Unmute' : 'Mute'}
                                >
                                    {isMutedLocal ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    )}
                                </button>
                                <button
                                    onClick={onStopVoice}
                                    className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                    title="Disconnect"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                {voiceState === 'active' && (
                                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {voiceError && (
                        <p className="mt-1 text-[10px] text-red-400">{voiceError}</p>
                    )}
                </div>
            )}

            {/* Draw Offer Banner */}
            {isDrawOfferedToMe && (
                <div className="px-3 py-2 bg-amber-500/10 border-t border-amber-500/30">
                    <p className="text-xs text-amber-400 mb-2">Your opponent offers a draw</p>
                    <div className="flex gap-2">
                        <button
                            onClick={onAcceptDraw}
                            className="flex-1 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors"
                        >
                            Accept
                        </button>
                        <button
                            onClick={onDeclineDraw}
                            className="flex-1 py-1.5 text-xs font-medium bg-slate-700 text-slate-200 rounded hover:bg-slate-600 transition-colors"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            )}

            {/* Game Actions */}
            {isPlayer && !gameOver && (
                <div className="p-3 border-t border-[#3d3a37]">
                    <div className="flex gap-2">
                        <button
                            onClick={onOfferDraw}
                            disabled={hasDrawOffer}
                            className={`
                                flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-sm font-medium transition-all
                                ${didIOfferDraw
                                    ? 'bg-amber-500/20 text-amber-400 cursor-default'
                                    : hasDrawOffer
                                        ? 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
                                        : 'bg-[#3d3a37] text-slate-200 hover:bg-[#4a4744]'}
                            `}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            {didIOfferDraw ? 'Draw Offered' : 'Offer Draw'}
                        </button>
                        <button
                            onClick={onResign}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                            </svg>
                            Resign
                        </button>
                    </div>
                </div>
            )}

            {/* Hidden audio element */}
            <audio ref={remoteAudioRef} hidden />
        </div>
    );
}
