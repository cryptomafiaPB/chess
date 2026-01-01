'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useOptimisticGame } from '@/features/game/hooks/useOptimisticGame';
import { useGameDetails } from '@/features/game/hooks/useGameDetails';
import { useChat } from '@/features/game/hooks/useChat';
import { useVoice } from '@/features/game/hooks/useVoice';
import { useDraw } from '@/features/game/hooks/useDraw';
import { useInactivityTimer } from '@/features/game/hooks/useInactivityTimer';
import { useMe } from '@/features/auth/hook/useAuth';
import { PlayerCard } from '@/components/game/PlayerCardNew';
import { MoveHistoryBar } from '@/components/game/MoveHistoryBar';
import { GameSidePanel } from '@/components/game/GameSidePanel';
import { ChatDialog } from '@/components/game/ChatDialog';
import { PostGameModal } from '@/components/game/PostGameModal';
import { InactivityWarning } from '@/components/game/InactivityWarning';
import { GameSoundEffects } from '@/components/game/GameSoundEffects';
import { ChessBoard, BoardEventType } from '@/components/game/ChessBoard';
import { useGameSounds } from '@/features/game/hooks/useSound';
import type { Piece } from '@/types/chess';
import { getSideToMoveFromFen } from '@/utils/chessHelpers';
import { Chess } from 'chess.js';

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
    const [gameEvent, setGameEvent] = useState<BoardEventType>(null);
    const [gameWinner, setGameWinner] = useState<'white' | 'black' | null>(null);
    const [wasActiveParticipant, setWasActiveParticipant] = useState(false);

    const { data: me } = useMe();
    const myUserId = (me as any)?.id ?? (me as any)?.userId ?? (me as any)?.user?.id;

    const chat = useChat(gameId);
    const voice = useVoice(gameId);
    const draw = useDraw(gameId);
    const { playMove, playIllegal, playGameStart, playGameEnd, playDraw } = useGameSounds();

    // Inactivity timer tracking - only run when game is actually active
    const inactivity = useInactivityTimer(gameId, state?.status ?? 'waiting');

    const loading = stateLoading || detailsLoading;

    // Check detection using chess.js
    const { isInCheck, checkSquare } = useMemo(() => {
        if (!state?.fen) return { isInCheck: false, checkSquare: undefined };
        try {
            const chess = new Chess(state.fen);
            if (chess.isCheck()) {
                // Find the king square of the side to move (they're in check)
                const colorInCheck = chess.turn(); // 'w' or 'b'
                const board = chess.board();
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        const piece = board[row][col];
                        if (piece?.type === 'k' && piece.color === colorInCheck) {
                            const file = String.fromCharCode(97 + col); // a-h
                            const rank = 8 - row; // 1-8
                            return { isInCheck: true, checkSquare: `${file}${rank}` };
                        }
                    }
                }
            }
            return { isInCheck: false, checkSquare: undefined };
        } catch {
            return { isInCheck: false, checkSquare: undefined };
        }
    }, [state?.fen]);

    // Show game event on board when game ends
    useEffect(() => {
        if (state?.status === 'completed' && state.resultReason) {
            let eventType: BoardEventType = null;
            let winner: 'white' | 'black' | null = null;

            // Determine winner from result
            if (state.result === 'white') winner = 'white';
            else if (state.result === 'black') winner = 'black';

            // Map result reason to event type
            if (state.resultReason === 'checkmate') {
                eventType = 'checkmate';
            } else if (state.resultReason === 'stalemate') {
                eventType = 'stalemate';
            } else if (state.resultReason?.includes('draw') || state.resultReason === 'repetition' || state.resultReason === 'insufficient' || state.resultReason === 'fifty_move') {
                eventType = 'draw';
            } else if (state.resultReason === 'timeout') {
                eventType = 'timeout';
            } else if (state.resultReason === 'resignation') {
                eventType = 'resign';
            }

            setGameEvent(eventType);
            setGameWinner(winner);
        }
    }, [state?.status, state?.result, state?.resultReason]);

    // Show check indicator briefly when in check
    useEffect(() => {
        if (isInCheck && state?.status === 'active') {
            setGameEvent('check');
            setGameWinner(null);
        } else if (!isInCheck && gameEvent === 'check') {
            setGameEvent(null);
        }
    }, [isInCheck, state?.status, gameEvent]);

    // Track when user was on the page when game was active (to allow post-game viewing)
    // This is NOT persisted - if they refresh or leave, the page becomes invalid
    useEffect(() => {
        if (state?.status === 'active' && (state.role === 'white' || state.role === 'black')) {
            // User is on the page while game is active - mark them as participant
            setWasActiveParticipant(true);
        }
    }, [state?.status, state?.role]);

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

    // Perform move with optimistic update and immediate sound
    const performMove = useCallback((from: string, to: string, promotion?: string) => {
        clearSelection();

        // Use chess.js to validate move locally and get move info for sound
        if (state?.fen) {
            try {
                const tempChess = new Chess(state.fen);
                const move = tempChess.move({ from, to, promotion });

                if (move) {
                    // Play sound immediately based on move type
                    const isCheckmate = tempChess.isCheckmate();
                    const isCheck = tempChess.isCheck();
                    const isCapture = move.captured !== undefined;
                    const isCastle = move.san === 'O-O' || move.san === 'O-O-O';
                    const isPromotion = move.promotion !== undefined;

                    playMove({ isCapture, isCheck, isCheckmate, isCastle, isPromotion });
                }
            } catch {
                // If move validation fails locally, sound will be skipped
            }
        }

        // Make move with local validation + optimistic update
        const result = makeMove(from, to, promotion);

        if (result.isPromotion) {
            // Need promotion selection
            setPendingPromotion({ from, to });
            return;
        }

        if (!result.success) {
            playIllegal();
        }

        // Move was applied optimistically (or rejected locally)
        // UI updates instantly, server sync happens in background
    }, [clearSelection, makeMove, state?.fen, playMove, playIllegal]);

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
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 text-center px-6 max-w-md">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Game Not Found</h1>
                    <p className="text-muted-foreground">
                        The game you're looking for doesn't exist or has been removed.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="mt-4 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all"
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
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading game…</p>
                </div>
            </div>
        );
    }

    // Check if this is an expired/completed game
    const isCompletedGame = state.status === 'completed' || state.status === 'aborted';

    // Note: Users trying to access completed games via URL will get 'game:error' 
    // from backend and see "Game Not Found". Only users who were on the page 
    // when the game ended (wasActiveParticipant = true) can see the completed board.

    return (
        <div className="fixed inset-0 bg-background overflow-hidden">
            {/* Waiting for opponent overlay */}
            {isWaiting && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm bg-card p-8 rounded-2xl border border-border/50">
                        <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        <h2 className="text-xl font-bold text-foreground">Waiting for opponent...</h2>
                        <p className="text-sm text-muted-foreground">
                            Game will begin when both players are ready
                        </p>
                    </div>
                </div>
            )}

            {/* Inactivity Warning - Fixed position overlay */}
            <InactivityWarning
                inactivity={inactivity}
                isMyTurn={isMyTurn}
                playerColor={playerColor}
            />

            {/* ==================== MOBILE LAYOUT ==================== */}
            <div className="md:hidden h-full flex flex-col bg-background">
                {/* Mobile Header - Fixed height */}
                <header className="shrink-0 h-12 flex items-center justify-between px-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <div className="text-center">
                        {gameOver && state.result ? (
                            <span className="text-sm font-bold text-foreground">
                                {state.result === 'draw' ? 'Draw' :
                                    state.result.includes('white') ? 'White Wins' : 'Black Wins'}
                            </span>
                        ) : (
                            <span className={`text-xs font-medium ${isMyTurn ? 'text-primary' : 'text-muted-foreground'}`}>
                                {isMyTurn ? 'Your turn' : "Opponent's turn"}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${state.presence[state.role === 'white' ? 'black' : 'white'] === 'online' ? 'bg-primary' : 'bg-destructive'}`} />
                    </div>
                </header>

                {/* Mobile Move History Bar */}
                <div className="shrink-0 px-2 py-1.5">
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
                        <div className="w-full max-w-[min(100%,calc(100vh-280px))] aspect-square rounded-xl overflow-hidden shadow-lg">
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
                                isCheck={isInCheck}
                                checkSquare={checkSquare}
                                gameEvent={gameEvent}
                                winner={gameWinner}
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
                <div className="shrink-0 h-16 flex items-center justify-center gap-4 px-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
                    {!gameOver && isPlayer && (
                        <>
                            <button
                                onClick={handleOfferDraw}
                                className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-amber-500 hover:bg-muted transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="text-[9px]">Draw</span>
                            </button>
                            <button
                                onClick={resign}
                                className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-destructive hover:bg-muted transition-all"
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
                        className="relative flex flex-col items-center gap-0.5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-[9px]">Chat</span>
                    </button>

                    <button
                        onClick={voice.state === 'active' ? voice.toggleMuteLocal : voice.startVoice}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${voice.state === 'active' && !voice.isMutedLocal
                            ? 'text-primary bg-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${voice.state === 'active' && !voice.isMutedRemote
                            ? 'text-primary bg-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50'
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
            <div className="hidden md:flex h-screen w-full bg-background">
                {/* Main Content Area - Centered */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="flex gap-6 h-full max-h-[calc(100vh-48px)] w-full">
                        {/* Left Section: Board with Player Cards */}
                        <div className="flex flex-col h-full w-full">
                            {/* Top Player Card - Compact */}
                            <div className="mb-2">
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
                                <div className="h-full aspect-square max-h-[calc(100vh-160px)] rounded-xl overflow-hidden shadow-xl ring-1 ring-border/30">
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
                                        isCheck={isInCheck}
                                        checkSquare={checkSquare}
                                        gameEvent={gameEvent}
                                        winner={gameWinner}
                                    />
                                </div>
                            </div>

                            {/* Bottom Player Card - Compact */}
                            <div className="mt-2">
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
                <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
                    <div className="bg-card rounded-2xl p-6 shadow-2xl border border-border/50 mx-4 max-w-sm w-full">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-lg font-semibold text-foreground">Draw Offered</span>
                        </div>
                        <p className="text-sm text-muted-foreground text-center mb-5">
                            Your opponent is offering a draw. Do you accept?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDeclineDraw}
                                className="flex-1 py-3 px-4 rounded-xl bg-destructive/20 text-destructive font-medium hover:bg-destructive/30 transition-all"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAcceptDraw}
                                className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Promotion Modal */}
            {pendingPromotion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
                    <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50">
                        <h3 className="text-lg font-bold text-foreground mb-4 text-center">Promote to:</h3>
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
                                        className={`w-14 h-14 rounded-xl transition-all flex items-center justify-center text-3xl hover:scale-105 ${isWhite
                                            ? 'bg-muted hover:bg-muted/80 text-foreground'
                                            : 'bg-muted/60 hover:bg-muted/50 text-foreground'
                                            }`}
                                    >
                                        {symbols[piece]}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={handleCancelPromotion}
                            className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Sound Effects - handles opponent moves and game events */}
            <GameSoundEffects gameId={gameId} isActive={state?.status === 'active'} myUserId={myUserId} />
        </div>
    );
}
