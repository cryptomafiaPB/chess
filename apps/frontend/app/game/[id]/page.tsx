'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useOptimisticGame } from '@/features/game/hooks/useOptimisticGame';
import { useGameDetails } from '@/features/game/hooks/useGameDetails';
import { useChat } from '@/features/game/hooks/useChat';
import { useVoice } from '@/features/game/hooks/useVoice';
import { useDraw } from '@/features/game/hooks/useDraw';
import { useInactivityTimer } from '@/features/game/hooks/useInactivityTimer';
import { useMe } from '@/features/auth/hook/useAuth';
import { ChessBoard } from '@/components/game/ChessBoard';
import { PlayerCard } from '@/components/game/PlayerCardNew';
import { MoveHistoryBar } from '@/components/game/MoveHistoryBar';
import { GameSidePanel } from '@/components/game/GameSidePanel';
import { ChatDialog } from '@/components/game/ChatDialog';
import { PostGameModal } from '@/components/game/PostGameModal';
import { InactivityWarning } from '@/components/game/InactivityWarning';
import type { Piece } from '@/types/chess';
import { getSideToMoveFromFen } from '@/utils/chessHelpers';

type PromotionPiece = 'q' | 'r' | 'b' | 'n';

export default function GamePage() {
    const params = useParams<{ id: string }>();
    const gameId = params.id;

    // Static game data (players, time control) - fetched once via REST
    const { data: gameDetails, isLoading: detailsLoading } = useGameDetails(gameId);

    // Optimistic game state with local validation
    const {
        state,
        loading: stateLoading,
        error,
        moveHistory,
        makeMove,
        getLegalMoves,
        resign,
    } = useOptimisticGame(gameId);

    // Local UI state for move selection
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
    const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showPostGameModal, setShowPostGameModal] = useState(true);

    const { data: me } = useMe();
    const myUserId = (me as any)?.id ?? (me as any)?.userId ?? (me as any)?.user?.id;

    const chat = useChat(gameId);
    const voice = useVoice(gameId);
    const draw = useDraw(gameId);

    // Inactivity timer tracking
    const inactivity = useInactivityTimer(gameId, state?.status ?? 'active');

    const loading = stateLoading || detailsLoading;

    // Derived state (computed from state, safe to use before/after loading check)
    const lastMoveSquares = state?.lastMove ? [state.lastMove.from, state.lastMove.to] : [];
    const isPlayer = state?.role === 'white' || state?.role === 'black';
    const isWaiting = state?.status === 'waiting';
    const gameOver = state?.status === 'completed' || state?.status === 'aborted';
    const sideToMove = state?.clocks?.activeColor ?? (state?.fen ? getSideToMoveFromFen(state.fen) : 'white');
    const isMyTurn = isPlayer && sideToMove === state?.role;
    // Can only move when game is active (not waiting, not over)
    const canMove = isPlayer && state?.status === 'active' && isMyTurn;
    const orientation: 'white' | 'black' = state?.role === 'black' ? 'black' : 'white';
    const playerColor = state?.role === 'white' || state?.role === 'black' ? state.role : null;

    // Get player info
    const whitePlayer = gameDetails?.whitePlayer ?? { id: 0, username: 'White', rating: 1500, avatarUrl: undefined, country: undefined };
    const blackPlayer = gameDetails?.blackPlayer ?? { id: 0, username: 'Black', rating: 1500, avatarUrl: undefined, country: undefined };

    // Determine which player is on top/bottom based on orientation
    const topPlayer = orientation === 'white' ? blackPlayer : whitePlayer;
    const bottomPlayer = orientation === 'white' ? whitePlayer : blackPlayer;
    const topColor: 'white' | 'black' = orientation === 'white' ? 'black' : 'white';
    const bottomColor: 'white' | 'black' = orientation === 'white' ? 'white' : 'black';
    const isTopActive = sideToMove === topColor;
    const isBottomActive = sideToMove === bottomColor;

    // Clear selection and hints - MUST be before any early returns
    const clearSelection = useCallback(() => {
        setSelectedSquare(null);
        setHighlightedSquares([]);
    }, []);

    // Select a square and show legal moves (local validation - instant)
    const handleSelectSquare = useCallback((square: string) => {
        if (!canMove) return;
        setSelectedSquare(square);
        // Get legal moves locally - instant, no server round trip
        const legalMoves = getLegalMoves(square);
        setHighlightedSquares(legalMoves);
    }, [canMove, getLegalMoves]);

    // Perform move with optimistic update
    const performMove = useCallback((from: string, to: string, promotion?: string) => {
        clearSelection();

        // Make move with local validation + optimistic update
        const result = makeMove(from, to, promotion);

        if (result.isPromotion) {
            // Need promotion selection
            setPendingPromotion({ from, to });
            return;
        }

        // Move was applied optimistically (or rejected locally)
        // UI updates instantly, server sync happens in background
    }, [clearSelection, makeMove]);

    // Handle drag-and-drop or click-to-move
    const handleMove = useCallback((from: string, to: string) => {
        if (!canMove) return;
        performMove(from, to);
    }, [canMove, performMove]);

    const handleChoosePromotion = useCallback((piece: PromotionPiece) => {
        if (!pendingPromotion) return;
        performMove(pendingPromotion.from, pendingPromotion.to, piece);
        setPendingPromotion(null);
    }, [pendingPromotion, performMove]);

    const handleCancelPromotion = useCallback(() => {
        setPendingPromotion(null);
    }, []);

    const handleSquareClick = useCallback((square: string, piece: Piece | null) => {
        if (!canMove || !state) return;
        const myPrefix = state.role === 'white' ? 'w' : state.role === 'black' ? 'b' : null;

        if (!selectedSquare) {
            // Clicking on own piece - select it
            if (!piece || !myPrefix || !piece.startsWith(myPrefix)) return;
            handleSelectSquare(square);
            return;
        }

        if (square === selectedSquare) {
            // Clicking same square - deselect
            clearSelection();
            return;
        }

        // Clicking different square - try to move
        performMove(selectedSquare, square);
    }, [canMove, state, selectedSquare, handleSelectSquare, clearSelection, performMove]);

    const handleOfferDraw = useCallback(() => {
        draw.offerDraw();
    }, [draw]);

    const handleAcceptDraw = useCallback(() => {
        draw.acceptDraw();
    }, [draw]);

    const handleDeclineDraw = useCallback(() => {
        draw.declineDraw();
    }, [draw]);

    // Inactivity info for player cards
    const getInactivityInfo = useCallback((color: 'white' | 'black') => {
        if (inactivity.activeColor !== color) return undefined;
        return {
            isActive: inactivity.isActive,
            progress: inactivity.progress,
            isWarning: inactivity.isWarning,
            warningSeconds: inactivity.warningSeconds
        };
    }, [inactivity]);

    // Error state - Game not found or other errors
    if (error && error.type === 'not_found') {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#312e2b]">
                <div className="flex flex-col items-center gap-4 text-center px-6 max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Game Not Found</h1>
                    <p className="text-slate-400">
                        The game you're looking for doesn't exist or has been removed.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="mt-4 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    // Loading state - AFTER all hooks
    if (loading || !state) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#312e2b]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Loading game…</p>
                </div>
            </div>
        );
    }

    // Check if this is an expired completed game
    const isExpiredGame = state.isExpired && state.status === 'completed';

    return (
        <div className="fixed inset-0 bg-[#312e2b] overflow-hidden">
            {/* Waiting for opponent overlay */}
            {isWaiting && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
                        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <h2 className="text-xl font-bold text-white">Waiting for opponent...</h2>
                        <p className="text-sm text-slate-400">
                            Game will begin when both players are ready
                        </p>
                    </div>
                </div>
            )}

            {/* Expired Game Notice Banner */}
            {isExpiredGame && (
                <div className="absolute top-0 left-0 right-0 z-50 bg-amber-500/90 text-black px-4 py-2 text-center text-sm font-medium">
                    <span>This game has ended. Move history is no longer available.</span>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="ml-3 px-3 py-1 bg-black/20 hover:bg-black/30 rounded text-xs font-semibold transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            )}

            {/* Inactivity Warning - Fixed position overlay */}
            <InactivityWarning
                inactivity={inactivity}
                isMyTurn={isMyTurn}
                playerColor={playerColor}
            />

            {/* ==================== MOBILE LAYOUT ==================== */}
            <div className="md:hidden h-full flex flex-col bg-[#1e1d1b]">
                {/* Mobile Header - Fixed height */}
                <header className="shrink-0 h-10 flex items-center justify-between px-3 border-b border-[#3d3a37]">
                    <button
                        onClick={() => window.history.back()}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#3d3a37] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <div className="text-center">
                        {gameOver && state.result ? (
                            <span className="text-sm font-bold text-white">
                                {state.result === 'draw' ? 'Draw' :
                                    state.result.includes('white') ? 'White Wins' : 'Black Wins'}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400">
                                {isMyTurn ? 'Your turn' : "Opponent's turn"}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${state.presence[state.role === 'white' ? 'black' : 'white'] === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    </div>
                </header>

                {/* Mobile Move History Bar */}
                <div className="shrink-0 px-2 py-1">
                    <MoveHistoryBar moves={moveHistory} />
                </div>

                {/* Top Player Card - Fixed height */}
                <div className="shrink-0 px-2 py-1">
                    <PlayerCard
                        username={topPlayer.username}
                        rating={topPlayer.rating}
                        country={topPlayer.country}
                        avatarUrl={topPlayer.avatarUrl}
                        clocks={state.clocks}
                        status={state.status}
                        color={topColor}
                        isActive={isTopActive && !gameOver}
                        presence={state.presence[topColor]}
                        inactivity={getInactivityInfo(topColor)}
                        compact
                    />
                </div>

                {/* Chess Board - Fills remaining space */}
                <div className="flex-1 flex items-center justify-center px-2 py-1 min-h-0">
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-full max-w-[min(100%,calc(100vh-280px))] aspect-square">
                            {/* {error && (
                                <div className="mb-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs text-center">
                                    {error}
                                </div>
                            )} */}
                            <ChessBoard
                                fen={state.fen}
                                canMove={canMove}
                                orientation={orientation}
                                highlightedSquares={highlightedSquares}
                                selectedSquare={selectedSquare ?? undefined}
                                lastMoveSquares={lastMoveSquares}
                                playerColor={state.role === 'white' ? 'white' : state.role === 'black' ? 'black' : undefined}
                                onMove={handleMove}
                                onSelectSquare={handleSelectSquare}
                                onSquareClick={handleSquareClick}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Player Card - Fixed height */}
                <div className="shrink-0 px-2 py-1">
                    <PlayerCard
                        username={bottomPlayer.username}
                        rating={bottomPlayer.rating}
                        country={bottomPlayer.country}
                        avatarUrl={bottomPlayer.avatarUrl}
                        clocks={state.clocks}
                        status={state.status}
                        color={bottomColor}
                        isActive={isBottomActive && !gameOver}
                        presence={state.presence[bottomColor]}
                        inactivity={getInactivityInfo(bottomColor)}
                        compact
                    />
                </div>

                {/* Mobile Action Bar - Fixed height */}
                <div className="shrink-0 h-14 flex items-center justify-center gap-4 px-4 border-t border-slate-700/50">
                    {!gameOver && isPlayer && (
                        <>
                            <button
                                onClick={handleOfferDraw}
                                className="flex flex-col items-center gap-0.5 p-2 rounded-lg text-amber-400 hover:bg-slate-800/50 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="text-[9px]">Draw</span>
                            </button>
                            <button
                                onClick={resign}
                                className="flex flex-col items-center gap-0.5 p-2 rounded-lg text-red-400 hover:bg-slate-800/50 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                </svg>
                                <span className="text-[9px]">Resign</span>
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="relative flex flex-col items-center gap-0.5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-[9px]">Chat</span>
                    </button>

                    <button
                        onClick={voice.state === 'active' ? voice.toggleMuteLocal : voice.startVoice}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${voice.state === 'active' && !voice.isMutedLocal
                            ? 'text-sky-400 bg-sky-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span className="text-[9px]">Mic</span>
                    </button>

                    <button
                        onClick={voice.state === 'active' ? voice.stopVoice : undefined}
                        disabled={voice.state !== 'active'}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${voice.state === 'active' && !voice.isMutedRemote
                            ? 'text-sky-400 bg-sky-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:opacity-50'
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        <span className="text-[9px]">Sound</span>
                    </button>
                </div>
            </div>

            {/* ==================== DESKTOP LAYOUT ==================== */}
            <div className="hidden md:flex h-screen w-full bg-[#312e2b]">
                {/* Main Content Area - Centered */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="flex gap-4 h-full max-h-[calc(100vh-32px)] w-full ">
                        {/* Left Section: Board with Player Cards */}
                        <div className="flex flex-col h-full w-full">
                            {/* Top Player Card - Compact */}
                            <div className="mb-1">
                                <PlayerCard
                                    username={topPlayer.username}
                                    rating={topPlayer.rating}
                                    country={topPlayer.country}
                                    avatarUrl={topPlayer.avatarUrl}
                                    clocks={state.clocks}
                                    status={state.status}
                                    color={topColor}
                                    isActive={isTopActive && !gameOver}
                                    presence={state.presence[topColor]}
                                    inactivity={getInactivityInfo(topColor)}
                                />
                            </div>

                            {/* Chess Board - Maximum size */}
                            <div className="flex-1 flex items-center justify-center min-h-0">
                                <div className="h-full aspect-square max-h-[calc(100vh-140px)] rounded-sm overflow-hidden shadow-xl">
                                    {/* {error && (
                                        <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm text-center">
                                            {error}
                                        </div>
                                    )} */}
                                    <ChessBoard
                                        fen={state.fen}
                                        canMove={canMove}
                                        orientation={orientation}
                                        highlightedSquares={highlightedSquares}
                                        selectedSquare={selectedSquare ?? undefined}
                                        lastMoveSquares={lastMoveSquares}
                                        playerColor={state.role === 'white' ? 'white' : state.role === 'black' ? 'black' : undefined}
                                        onMove={handleMove}
                                        onSelectSquare={handleSelectSquare}
                                        onSquareClick={handleSquareClick}
                                    />
                                </div>
                            </div>

                            {/* Bottom Player Card - Compact */}
                            <div className="mt-1">
                                <PlayerCard
                                    username={bottomPlayer.username}
                                    rating={bottomPlayer.rating}
                                    country={bottomPlayer.country}
                                    avatarUrl={bottomPlayer.avatarUrl}
                                    clocks={state.clocks}
                                    status={state.status}
                                    color={bottomColor}
                                    isActive={isBottomActive && !gameOver}
                                    presence={state.presence[bottomColor]}
                                    inactivity={getInactivityInfo(bottomColor)}
                                />
                            </div>
                        </div>

                        {/* Right Section: Side Panel */}
                        <div className="w-[560px] h-full flex flex-col">
                            <GameSidePanel
                                moves={moveHistory}
                                chatMessages={chat.messages}
                                onSendMessage={chat.sendMessage}
                                sendingMessage={chat.sending}
                                myUserId={myUserId}
                                voiceState={voice.state}
                                voiceError={voice.error}
                                isMutedLocal={voice.isMutedLocal}
                                isMutedRemote={voice.isMutedRemote}
                                canUseVoice={isPlayer}
                                onStartVoice={voice.startVoice}
                                onStopVoice={voice.stopVoice}
                                onToggleMute={voice.toggleMuteLocal}
                                remoteAudioRef={voice.remoteAudioRef}
                                isPlayer={isPlayer}
                                gameOver={gameOver}
                                onResign={resign}
                                onOfferDraw={handleOfferDraw}
                                drawState={draw.drawState}
                                onAcceptDraw={handleAcceptDraw}
                                onDeclineDraw={handleDeclineDraw}
                                myColor={playerColor}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Chat Dialog */}
            <ChatDialog
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={chat.messages}
                onSend={chat.sendMessage}
                sending={chat.sending}
                myUserId={myUserId}
            />

            {/* Post Game Modal */}
            <PostGameModal
                isOpen={gameOver && showPostGameModal}
                onClose={() => setShowPostGameModal(false)}
                gameId={gameId}
                result={state.result ?? undefined}
                role={state.role === 'white' ? 'white' : state.role === 'black' ? 'black' : 'spectator'}
            />

            {/* Mobile Draw Offer Overlay */}
            {draw.drawState.pendingResponse && draw.drawState.offeredBy !== playerColor && (
                <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#262522] rounded-xl p-5 shadow-2xl border border-[#3d3a37] mx-4 max-w-sm w-full">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-lg font-semibold text-white">Draw Offered</span>
                        </div>
                        <p className="text-sm text-slate-400 text-center mb-5">
                            Your opponent is offering a draw. Do you accept?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeclineDraw}
                                className="flex-1 py-3 px-4 rounded-lg bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAcceptDraw}
                                className="flex-1 py-3 px-4 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Promotion Modal */}
            {pendingPromotion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700/50">
                        <h3 className="text-lg font-bold text-white mb-4 text-center">Promote to:</h3>
                        <div className="flex gap-3">
                            {(['q', 'r', 'b', 'n'] as const).map((piece) => {
                                // Show correct color pieces based on player color
                                const isWhite = playerColor === 'white';
                                const symbols = isWhite
                                    ? { q: '♕', r: '♖', b: '♗', n: '♘' }
                                    : { q: '♛', r: '♜', b: '♝', n: '♞' };
                                return (
                                    <button
                                        key={piece}
                                        onClick={() => handleChoosePromotion(piece)}
                                        className={`w-14 h-14 rounded-xl transition-colors flex items-center justify-center text-3xl ${isWhite
                                            ? 'bg-slate-600 hover:bg-slate-500 text-white'
                                            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                            }`}
                                    >
                                        {symbols[piece]}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={handleCancelPromotion}
                            className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
