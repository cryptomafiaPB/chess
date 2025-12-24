'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useGameState } from '@/features/game/hooks/useGameState';
import { useMoveHints } from '@/features/game/hooks/useMoveHints';
import { useClockDisplay } from '@/features/game/hooks/useClockDisplay';
import { ClockPanel } from '@/components/game/ClockPanel';
import { useChat } from '@/features/game/hooks/useChat';
import { useVoice } from '@/features/game/hooks/useVoice';
import { useMe } from '@/features/auth/hook/useAuth';
import { ChessBoard } from '@/components/game/ChessBoard';
import { ChatPanel } from '@/components/game/ChatPanel';
import { VoiceControls } from '@/components/game/VoiceControl';
import { Button } from '@/components/ui/button';

type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export default function GamePage() {
    const params = useParams<{ id: string }>();
    const gameId = params.id;

    const { state, loading, error, sendMove, resign } = useGameState(gameId);
    const { highlightedSquares, requestHints, clearHints } =
        useMoveHints(gameId);
    const [pendingPromotion, setPendingPromotion] = useState<{
        from: string;
        to: string;
    } | null>(null);

    // clocks are rendered by ClockPanel (keeps clock updates local)

    const { data: me } = useMe();
    const myUserId =
        (me as any)?.id ?? (me as any)?.userId ?? (me as any)?.user?.id;

    const chat = useChat(gameId);
    const voice = useVoice(gameId);

    if (loading || !state) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading game…</p>
            </div>
        );
    }

    const isPlayer = state.role === 'white' || state.role === 'black';
    const gameOver = state.status !== 'active';
    const canMove = isPlayer && !gameOver;
    const orientation: 'white' | 'black' =
        state.role === 'black' ? 'black' : 'white';

    const handleSelectSquare = (square: string) => {
        if (!canMove) return;
        requestHints(square);
    };

    const performMove = (from: string, to: string, promotion?: string) => {
        clearHints();
        sendMove(from, to, promotion);
    };

    const handleMove = (from: string, to: string) => {
        if (!canMove) return;

        const isWhiteTurn = state.role === 'white';
        const fromRank = parseInt(from[1], 10);
        const toRank = parseInt(to[1], 10);

        const isPromotion =
            (isWhiteTurn && fromRank === 7 && toRank === 8) ||
            (!isWhiteTurn && fromRank === 2 && toRank === 1);

        if (isPromotion) {
            setPendingPromotion({ from, to });
            return;
        }

        performMove(from, to);
    };

    const handleChoosePromotion = (piece: PromotionPiece) => {
        if (!pendingPromotion) return;
        performMove(pendingPromotion.from, pendingPromotion.to, piece);
        setPendingPromotion(null);
    };

    const handleCancelPromotion = () => {
        setPendingPromotion(null);
    };

    console.log("Main")

    return (
        <div className="flex h-[calc(100vh-3rem)] flex-col gap-4 p-4 md:flex-row">
            {/* Left: board + clocks */}
            <div className="flex flex-1 flex-col items-center rounded-md border bg-card p-4">
                <ClockPanel
                    clocks={state.clocks}
                    fen={state.fen}
                    status={state.status}
                    whiteLabel={state.whitePlayer.username ?? state.whitePlayer.id}
                    blackLabel={state.blackPlayer.username ?? state.blackPlayer.id}
                    presence={state.presence}
                />

                {error && (
                    <p className="mb-2 text-xs text-red-500">
                        {error}
                    </p>
                )}

                <ChessBoard
                    fen={state.fen}
                    canMove={canMove}
                    orientation={orientation}
                    highlightedSquares={highlightedSquares}
                    onMove={handleMove}
                    onSelectSquare={handleSelectSquare}
                    result={state.result ?? undefined}
                    gameOver={gameOver}
                />

                {pendingPromotion && (
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            Promote pawn to:
                        </span>
                        {(['q', 'r', 'b', 'n'] as PromotionPiece[]).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => handleChoosePromotion(p)}
                                className="rounded border bg-card px-2 py-1 text-xs hover:bg-accent"
                            >
                                {p.toUpperCase()}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={handleCancelPromotion}
                            className="ml-2 text-xs text-muted-foreground hover:underline"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {gameOver && state.result && (
                    <p className="mt-2 text-xs text-emerald-500">
                        Game over: {state.result} ({state.resultReason})
                    </p>
                )}
            </div>

            {/* Right: sidebar */}
            <div className="flex w-full bg-gray-100 p-2 rounded-md sm:max-w-xs flex-col gap-4">
                <div className="rounded-md border bg-card p-3 text-sm">
                    <div className="mb-1 font-medium">Players</div>
                    <p>
                        White:{' '}
                        <span className="font-medium">
                            {state.whitePlayer.username ?? state.whitePlayer.id}
                        </span>{' '}
                        <span className="text-xs text-muted-foreground">
                            ({state.presence.white})
                        </span>
                    </p>
                    <p>
                        Black:{' '}
                        <span className="font-medium">
                            {state.blackPlayer.username ?? state.blackPlayer.id}
                        </span>{' '}
                        <span className="text-xs text-muted-foreground">
                            ({state.presence.black})
                        </span>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        You are: {state.role}
                    </p>
                </div>

                {isPlayer && !gameOver && (
                    <Button
                        variant="destructive"
                        onClick={resign}
                    >
                        Resign
                    </Button>
                )}

                <ChatPanel
                    messages={chat.messages}
                    onSend={chat.sendMessage}
                    sending={chat.sending}
                    myUserId={myUserId}
                />

                <VoiceControls
                    voiceState={voice.state}
                    error={voice.error}
                    isMutedLocal={voice.isMutedLocal}
                    isMutedRemote={voice.isMutedRemote}
                    localLevel={voice.localLevel}
                    remoteLevel={voice.remoteLevel}
                    canUseVoice={isPlayer && !gameOver}
                    onStart={voice.startVoice}
                    onStop={voice.stopVoice}
                    onToggleMute={voice.toggleMuteLocal}
                    remoteAudioRef={voice.remoteAudioRef as React.RefObject<HTMLAudioElement>}
                />
            </div>
        </div>
    );
}
