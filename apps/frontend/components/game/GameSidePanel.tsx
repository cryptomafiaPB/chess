'use client';

import React, { RefObject, useState } from 'react';
import { MoveHistoryPanel } from './MoveHistoryPanel';
import { ChatPanel } from './ChatPanel';
import type { ChatMessage } from '@/features/game/hooks/useChat';
import type { DrawState } from '@/features/game/hooks/useDraw';
import { cn } from '@/lib/utils';
import {
    ListOrdered,
    MessageCircle,
    Mic,
    MicOff,
    Phone,
    PhoneOff,
    Handshake,
    Flag,
    Volume2,
    VolumeX,
    X
} from 'lucide-react';

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
        <div className="h-full w-full flex flex-col bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/50">
            {/* Tab Header */}
            <div className="flex border-b border-border/50">
                <button
                    onClick={() => setActiveTab('moves')}
                    className={cn(
                        'flex-1 px-4 py-3 text-sm font-medium transition-all',
                        'flex items-center justify-center gap-2',
                        activeTab === 'moves'
                            ? 'text-foreground bg-card border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                    )}
                >
                    <ListOrdered className="w-4 h-4" />
                    Moves
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                        'flex-1 px-4 py-3 text-sm font-medium transition-all relative',
                        'flex items-center justify-center gap-2',
                        activeTab === 'chat'
                            ? 'text-foreground bg-card border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                    )}
                >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                    {chatMessages.length > 0 && activeTab !== 'chat' && (
                        <span className="absolute top-2 right-3 w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
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
                <div className="px-3 py-2.5 border-t border-border/50 bg-card/50">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5" />
                            Voice
                        </span>
                        {voiceState === 'idle' ? (
                            <button
                                onClick={onStartVoice}
                                className="ml-auto px-3 py-1.5 text-xs font-medium bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all flex items-center gap-1.5"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                Connect
                            </button>
                        ) : voiceState === 'connecting' ? (
                            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Connecting...
                            </span>
                        ) : (
                            <div className="ml-auto flex items-center gap-1.5">
                                <button
                                    onClick={onToggleMute}
                                    className={cn(
                                        'p-1.5 rounded-lg transition-all',
                                        isMutedLocal
                                            ? 'bg-destructive/20 text-destructive'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                    )}
                                    title={isMutedLocal ? 'Unmute' : 'Mute'}
                                >
                                    {isMutedLocal ? (
                                        <MicOff className="w-4 h-4" />
                                    ) : (
                                        <Mic className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={onStopVoice}
                                    className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-all"
                                    title="Disconnect"
                                >
                                    <PhoneOff className="w-4 h-4" />
                                </button>
                                {voiceState === 'active' && (
                                    <span className="flex items-center gap-1 text-[10px] text-primary">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {voiceError && (
                        <p className="mt-1.5 text-[10px] text-destructive">{voiceError}</p>
                    )}
                </div>
            )}

            {/* Draw Offer Banner */}
            {isDrawOfferedToMe && (
                <div className="px-3 py-2.5 bg-amber-500/10 border-t border-amber-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Handshake className="w-4 h-4 text-amber-500" />
                        <p className="text-xs text-amber-500 font-medium">Your opponent offers a draw</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onAcceptDraw}
                            className="flex-1 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                        >
                            Accept
                        </button>
                        <button
                            onClick={onDeclineDraw}
                            className="flex-1 py-2 text-xs font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-all"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            )}

            {/* Game Actions */}
            {isPlayer && !gameOver && (
                <div className="p-3 border-t border-border/50">
                    <div className="flex gap-2">
                        <button
                            onClick={onOfferDraw}
                            disabled={hasDrawOffer}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                                didIOfferDraw && 'bg-amber-500/20 text-amber-500 cursor-default',
                                hasDrawOffer && !didIOfferDraw && 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed',
                                !hasDrawOffer && 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                            )}
                        >
                            <Handshake className="w-4 h-4" />
                            {didIOfferDraw ? 'Draw Offered' : 'Offer Draw'}
                        </button>
                        <button
                            onClick={onResign}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-all"
                        >
                            <Flag className="w-4 h-4" />
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
