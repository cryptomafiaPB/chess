// app/game/bot/page.tsx
// Offline bot game page - matches online game layout for consistency

'use client';

import { useEffect, useState, useCallback, useMemo, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChessBoard, BoardEventType } from '@/components/game/ChessBoard';
import { MoveHistoryBar } from '@/components/game/MoveHistoryBar';
import { Button } from '@/components/ui/button';
import { useOfflineGame, type PlayerColor } from '@/features/offline/hooks/useOfflineGame';
import { useGameSounds } from '@/features/game/hooks/useSound';
import { BOT_CONFIGS, type BotDifficulty } from '@/lib/chess/bot';
import type { Piece } from '@/types/chess';
import { cn } from '@/lib/utils';
import { Chess } from 'chess.js';

// Bot Player Card Component - matches PlayerCard style
function BotPlayerCard({
    difficulty,
    isActive,
    isThinking,
    compact = false,
}: {
    difficulty: BotDifficulty;
    isActive: boolean;
    isThinking: boolean;
    compact?: boolean;
}) {
    const config = BOT_CONFIGS[difficulty];
    const avatarSize = compact ? 'w-10 h-10' : 'w-12 h-12';

    return (
        <div
            className={cn(
                'relative flex items-center gap-2 rounded transition-all',
                compact ? 'px-2 py-1.5' : 'px-3 py-2',
                isActive ? 'bg-[#262522]' : 'bg-[#1e1d1b]'
            )}
        >
            {/* Bot Avatar */}
            <div className="relative shrink-0">
                <div className={cn(
                    avatarSize,
                    'rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl shadow-lg',
                    isThinking && 'animate-pulse'
                )}>
                    🤖
                </div>
                {/* Difficulty badge */}
                <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[9px] font-bold shadow-md border border-border">
                    {difficulty}
                </div>
                {/* Online indicator */}
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        'font-semibold truncate',
                        compact ? 'text-sm' : 'text-base'
                    )}>
                        {config.name} Bot
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {isThinking ? (
                        <span className="flex items-center gap-1 text-primary">
                            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
                            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
                            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
                            <span className="ml-0.5">Thinking</span>
                        </span>
                    ) : (
                        <span>Level {difficulty}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// Human Player Card Component
function HumanPlayerCard({
    isActive,
    isMyTurn,
    compact = false,
}: {
    isActive: boolean;
    isMyTurn: boolean;
    compact?: boolean;
}) {
    const avatarSize = compact ? 'w-10 h-10' : 'w-12 h-12';

    return (
        <div
            className={cn(
                'relative flex items-center gap-2 rounded transition-all',
                compact ? 'px-2 py-1.5' : 'px-3 py-2',
                isActive ? 'bg-[#262522]' : 'bg-[#1e1d1b]'
            )}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <div className={cn(
                    avatarSize,
                    'rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-xl shadow-lg'
                )}>
                    👤
                </div>
                {/* Online indicator */}
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        'font-semibold truncate',
                        compact ? 'text-sm' : 'text-base'
                    )}>
                        You
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {isMyTurn ? (
                        <span className="text-primary font-medium">Your turn</span>
                    ) : (
                        <span>Waiting...</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function BotGameContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const {
        state,
        startGame,
        makeMove,
        getLegalMoves,
        resign,
        resetGame,
        undoMove,
        canUndo,
    } = useOfflineGame();

    // Sound effects
    const { playMove, playIllegal, playGameStart, playGameEnd } = useGameSounds();
    const prevFenRef = useRef<string>('');
    const hasPlayedStartSound = useRef(false);

    // Parse URL params
    const difficulty = (parseInt(searchParams.get('difficulty') || '3', 10) || 3) as BotDifficulty;
    const playerColor = (searchParams.get('color') || 'white') as PlayerColor;

    // Local UI state
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [highlightedSquares, setHighlightedSquares] = useState<string[]>([]);
    const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);

    // Start game on mount
    useEffect(() => {
        if (state.status === 'idle') {
            startGame(playerColor, difficulty);
        }
    }, [state.status, playerColor, difficulty, startGame]);

    // Play game start sound
    useEffect(() => {
        if (state.status === 'playing' && !hasPlayedStartSound.current) {
            playGameStart();
            hasPlayedStartSound.current = true;
        }
    }, [state.status, playGameStart]);

    // Play sounds on moves (for bot moves)
    useEffect(() => {
        if (state.fen !== prevFenRef.current && prevFenRef.current !== '') {
            // A move was made, check if it was bot's move
            if (state.currentTurn === state.playerColor && state.moveHistory.length > 0) {
                // Bot just moved, play sound
                const lastMove = state.moveHistory[state.moveHistory.length - 1];
                try {
                    const chess = new Chess(state.fen);
                    const isCheck = chess.isCheck();
                    const isCheckmate = chess.isCheckmate();
                    const isCapture = lastMove?.captured !== undefined;
                    const isCastle = lastMove?.san === 'O-O' || lastMove?.san === 'O-O-O';
                    const isPromotion = lastMove?.promotion !== undefined;
                    playMove({ isCapture, isCheck, isCheckmate, isCastle, isPromotion });
                } catch {
                    playMove({});
                }
            }
        }
        prevFenRef.current = state.fen;
    }, [state.fen, state.currentTurn, state.playerColor, state.moveHistory, playMove]);

    // Play game end sound
    useEffect(() => {
        if (state.status === 'finished') {
            playGameEnd();
            const timer = setTimeout(() => setShowResultModal(true), 500);
            return () => clearTimeout(timer);
        }
    }, [state.status, playGameEnd]);

    // Board event for UI
    const gameEvent: BoardEventType = useMemo(() => {
        if (state.result?.isOver) {
            if (state.result.reason === 'checkmate') return 'checkmate';
            if (state.result.reason === 'stalemate') return 'stalemate';
            if (state.result.reason === 'draw' || state.result.reason === 'fifty-move' ||
                state.result.reason === 'threefold' || state.result.reason === 'insufficient') {
                return 'draw';
            }
        }
        if (state.isCheck && state.status === 'playing') return 'check';
        return null;
    }, [state.result, state.isCheck, state.status]);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedSquare(null);
        setHighlightedSquares([]);
    }, []);

    // Handle square selection
    const handleSelectSquare = useCallback((square: string) => {
        if (state.currentTurn !== state.playerColor || state.isBotThinking) {
            clearSelection();
            return;
        }

        const moves = getLegalMoves(square);
        if (moves.length > 0) {
            setSelectedSquare(square);
            setHighlightedSquares(moves.map(m => m.to));
        } else {
            clearSelection();
        }
    }, [state.currentTurn, state.playerColor, state.isBotThinking, getLegalMoves, clearSelection]);

    // Perform move with sound
    const performMove = useCallback((from: string, to: string, promotion?: string) => {
        clearSelection();

        // Check for promotion
        const moves = getLegalMoves(from);
        const promotionMoves = moves.filter(m => m.to === to && m.promotion);

        if (promotionMoves.length > 0 && !promotion) {
            setPendingPromotion({ from, to });
            return;
        }

        // Play sound immediately for player's move
        try {
            const chess = new Chess(state.fen);
            const move = chess.move({ from, to, promotion });
            if (move) {
                const isCheck = chess.isCheck();
                const isCheckmate = chess.isCheckmate();
                const isCapture = move.captured !== undefined;
                const isCastle = move.san === 'O-O' || move.san === 'O-O-O';
                const isPromotion = move.promotion !== undefined;
                playMove({ isCapture, isCheck, isCheckmate, isCastle, isPromotion });
            }
        } catch {
            // Ignore errors
        }

        const success = makeMove(from, to, promotion);
        if (!success) {
            playIllegal();
        }
        setPendingPromotion(null);
    }, [clearSelection, getLegalMoves, state.fen, makeMove, playMove, playIllegal]);

    // Handle drag-and-drop or click-to-move
    const handleMove = useCallback((from: string, to: string) => {
        if (state.currentTurn !== state.playerColor || state.isBotThinking) return;
        performMove(from, to);
    }, [state.currentTurn, state.playerColor, state.isBotThinking, performMove]);

    // Handle square click
    const handleSquareClick = useCallback((square: string, piece: Piece | null) => {
        if (state.currentTurn !== state.playerColor || state.isBotThinking) return;
        const myPrefix = state.playerColor === 'white' ? 'w' : 'b';

        if (!selectedSquare) {
            if (!piece || !piece.startsWith(myPrefix)) return;
            handleSelectSquare(square);
            return;
        }

        if (square === selectedSquare) {
            clearSelection();
            return;
        }

        performMove(selectedSquare, square);
    }, [state.currentTurn, state.playerColor, state.isBotThinking, selectedSquare, handleSelectSquare, clearSelection, performMove]);

    // Handle promotion selection
    const handleChoosePromotion = useCallback((piece: string) => {
        if (pendingPromotion) {
            performMove(pendingPromotion.from, pendingPromotion.to, piece);
        }
    }, [pendingPromotion, performMove]);

    // Format move history for MoveHistoryBar
    const formattedMoves = useMemo(() => {
        const moves: { moveNumber: number; white?: { san: string; from: string; to: string }; black?: { san: string; from: string; to: string } }[] = [];

        state.moveHistory.forEach((move, idx) => {
            const moveNum = Math.floor(idx / 2) + 1;
            const isWhite = idx % 2 === 0;

            if (isWhite) {
                moves.push({
                    moveNumber: moveNum,
                    white: { san: move.san || '', from: move.from, to: move.to },
                });
            } else {
                if (moves[moves.length - 1]) {
                    moves[moves.length - 1].black = { san: move.san || '', from: move.from, to: move.to };
                }
            }
        });

        return moves;
    }, [state.moveHistory]);

    // Can move check
    const canMove = state.status === 'playing' && state.currentTurn === state.playerColor && !state.isBotThinking;
    const gameOver = state.status === 'finished';
    const isMyTurn = state.currentTurn === state.playerColor && !state.isBotThinking;
    const orientation = state.playerColor;

    // Determine top/bottom players based on orientation
    const isTopBot = state.playerColor === 'white';
    const isTopActive = isTopBot ? state.currentTurn === 'black' : state.currentTurn === 'white';
    const isBottomActive = isTopBot ? state.currentTurn === 'white' : state.currentTurn === 'black';

    // Result helpers
    const getResultText = () => {
        if (!state.result?.isOver) return '';
        if (state.result.winner === 'draw') {
            return state.result.reason === 'stalemate' ? 'Stalemate!' : 'Draw!';
        }
        return state.result.winner === state.playerColor ? 'You Win! 🎉' : 'Bot Wins!';
    };

    const getResultSubtext = () => {
        if (!state.result?.isOver) return '';
        switch (state.result.reason) {
            case 'checkmate': return 'by checkmate';
            case 'stalemate': return 'No legal moves';
            case 'insufficient': return 'Insufficient material';
            case 'threefold': return 'Threefold repetition';
            case 'fifty-move': return 'Fifty move rule';
            default: return '';
        }
    };

    const handleNewGame = () => {
        setShowResultModal(false);
        hasPlayedStartSound.current = false;
        router.push('/play/bot');
    };

    const handleRematch = () => {
        setShowResultModal(false);
        hasPlayedStartSound.current = false;
        resetGame();
        setTimeout(() => startGame(playerColor, difficulty), 100);
    };

    const botConfig = BOT_CONFIGS[state.botDifficulty || difficulty];

    return (
        <div className="fixed inset-0 bg-background overflow-hidden">
            {/* ==================== MOBILE LAYOUT ==================== */}
            <div className="md:hidden h-full flex flex-col bg-background">
                {/* Mobile Header */}
                <header className="shrink-0 h-12 flex items-center justify-between px-3 border-b border-border/50 bg-card/50 backdrop-blur-sm">
                    <button
                        onClick={() => router.push('/play/bot')}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>

                    <div className="text-center">
                        {gameOver && state.result ? (
                            <span className="text-sm font-bold text-foreground">
                                {state.result.winner === 'draw' ? 'Draw' :
                                    state.result.winner === state.playerColor ? 'You Win!' : 'Bot Wins'}
                            </span>
                        ) : (
                            <span className={cn('text-xs font-medium', isMyTurn ? 'text-primary' : 'text-muted-foreground')}>
                                {isMyTurn ? 'Your turn' : 'Bot thinking...'}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">vs {botConfig.name}</span>
                    </div>
                </header>

                {/* Mobile Move History Bar */}
                <div className="shrink-0 px-2 py-1.5">
                    <MoveHistoryBar moves={formattedMoves} />
                </div>

                {/* Top Player Card */}
                <div className="shrink-0 px-2 py-1">
                    {isTopBot ? (
                        <BotPlayerCard
                            difficulty={state.botDifficulty || difficulty}
                            isActive={isTopActive && !gameOver}
                            isThinking={state.isBotThinking}
                            compact
                        />
                    ) : (
                        <HumanPlayerCard
                            isActive={isTopActive && !gameOver}
                            isMyTurn={isMyTurn}
                            compact
                        />
                    )}
                </div>

                {/* Chess Board */}
                <div className="flex-1 flex items-center justify-center px-2 py-1 min-h-0">
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-full max-w-[min(100%,calc(100vh-280px))] aspect-square rounded-xl overflow-hidden shadow-lg">
                            <ChessBoard
                                fen={state.fen}
                                canMove={canMove}
                                orientation={orientation}
                                highlightedSquares={highlightedSquares}
                                selectedSquare={selectedSquare ?? undefined}
                                lastMoveSquares={state.lastMove ? [state.lastMove.from, state.lastMove.to] : []}
                                playerColor={state.playerColor}
                                onMove={handleMove}
                                onSelectSquare={handleSelectSquare}
                                onSquareClick={handleSquareClick}
                                isCheck={state.isCheck}
                                checkSquare={state.checkSquare ?? undefined}
                                gameEvent={gameEvent}
                                winner={state.result?.winner === 'draw' ? null : state.result?.winner}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Player Card */}
                <div className="shrink-0 px-2 py-1">
                    {isTopBot ? (
                        <HumanPlayerCard
                            isActive={isBottomActive && !gameOver}
                            isMyTurn={isMyTurn}
                            compact
                        />
                    ) : (
                        <BotPlayerCard
                            difficulty={state.botDifficulty || difficulty}
                            isActive={isBottomActive && !gameOver}
                            isThinking={state.isBotThinking}
                            compact
                        />
                    )}
                </div>

                {/* Mobile Action Bar */}
                <div className="shrink-0 h-16 flex items-center justify-center gap-4 px-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
                    {!gameOver && (
                        <>
                            <button
                                onClick={undoMove}
                                disabled={!canUndo}
                                className={cn(
                                    'flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all',
                                    canUndo ? 'text-amber-500 hover:bg-muted' : 'text-muted-foreground/50'
                                )}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                </svg>
                                <span className="text-[9px]">Undo</span>
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
                        onClick={handleNewGame}
                        className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[9px]">New</span>
                    </button>
                </div>
            </div>

            {/* ==================== DESKTOP LAYOUT ==================== */}
            <div className="hidden md:flex h-screen w-full bg-background">
                {/* Main Content Area */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="flex gap-6 h-full max-h-[calc(100vh-48px)] w-full">
                        {/* Left Section: Board with Player Cards */}
                        <div className="flex flex-col h-full w-full">
                            {/* Top Player Card */}
                            <div className="mb-2">
                                {isTopBot ? (
                                    <BotPlayerCard
                                        difficulty={state.botDifficulty || difficulty}
                                        isActive={isTopActive && !gameOver}
                                        isThinking={state.isBotThinking}
                                    />
                                ) : (
                                    <HumanPlayerCard
                                        isActive={isTopActive && !gameOver}
                                        isMyTurn={isMyTurn}
                                    />
                                )}
                            </div>

                            {/* Chess Board */}
                            <div className="flex-1 flex items-center justify-center min-h-0">
                                <div className="h-full aspect-square max-h-[calc(100vh-160px)] rounded-xl overflow-hidden shadow-xl ring-1 ring-border/30">
                                    <ChessBoard
                                        fen={state.fen}
                                        canMove={canMove}
                                        orientation={orientation}
                                        highlightedSquares={highlightedSquares}
                                        selectedSquare={selectedSquare ?? undefined}
                                        lastMoveSquares={state.lastMove ? [state.lastMove.from, state.lastMove.to] : []}
                                        playerColor={state.playerColor}
                                        onMove={handleMove}
                                        onSelectSquare={handleSelectSquare}
                                        onSquareClick={handleSquareClick}
                                        isCheck={state.isCheck}
                                        checkSquare={state.checkSquare ?? undefined}
                                        gameEvent={gameEvent}
                                        winner={state.result?.winner === 'draw' ? null : state.result?.winner}
                                    />
                                </div>
                            </div>

                            {/* Bottom Player Card */}
                            <div className="mt-2">
                                {isTopBot ? (
                                    <HumanPlayerCard
                                        isActive={isBottomActive && !gameOver}
                                        isMyTurn={isMyTurn}
                                    />
                                ) : (
                                    <BotPlayerCard
                                        difficulty={state.botDifficulty || difficulty}
                                        isActive={isBottomActive && !gameOver}
                                        isThinking={state.isBotThinking}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Right Section: Side Panel */}
                        <div className="w-[360px] h-full flex flex-col bg-card rounded-xl border border-border/50 overflow-hidden">
                            {/* Header */}
                            <div className="p-4 border-b border-border/50">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="font-semibold">Bot Match</h2>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500">
                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                            Offline
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span>vs {botConfig.name} Bot</span>
                                    <span>•</span>
                                    <span>Level {state.botDifficulty || difficulty}</span>
                                </div>
                            </div>

                            {/* Move History */}
                            <div className="flex-1 p-4 overflow-hidden">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Move History</h3>
                                <div className="h-[calc(100%-28px)] overflow-y-auto rounded-lg border border-border bg-muted/30 p-2">
                                    {state.moveHistory.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            No moves yet
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                            {formattedMoves.map((move) => (
                                                <div key={move.moveNumber} className="contents">
                                                    <div className="flex gap-2 rounded px-2 py-1 hover:bg-muted/50">
                                                        <span className="w-6 text-muted-foreground">{move.moveNumber}.</span>
                                                        <span className="font-mono">{move.white?.san || ''}</span>
                                                    </div>
                                                    <div className="rounded px-2 py-1 hover:bg-muted/50">
                                                        <span className="font-mono">{move.black?.san || ''}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 border-t border-border/50 space-y-2">
                                {!gameOver && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2"
                                            onClick={undoMove}
                                            disabled={!canUndo}
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                            </svg>
                                            Undo
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
                                            onClick={resign}
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                            </svg>
                                            Resign
                                        </Button>
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={handleNewGame}
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    New Game
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Promotion Modal */}
            {pendingPromotion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
                    <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50">
                        <h3 className="text-lg font-bold text-foreground mb-4 text-center">Promote to:</h3>
                        <div className="flex gap-3">
                            {(['q', 'r', 'b', 'n'] as const).map((piece) => {
                                const isWhite = state.playerColor === 'white';
                                const symbols = isWhite
                                    ? { q: '♕', r: '♖', b: '♗', n: '♘' }
                                    : { q: '♛', r: '♜', b: '♝', n: '♞' };
                                return (
                                    <button
                                        key={piece}
                                        onClick={() => handleChoosePromotion(piece)}
                                        className={cn(
                                            'w-14 h-14 rounded-xl transition-all flex items-center justify-center text-3xl hover:scale-105',
                                            isWhite ? 'bg-muted hover:bg-muted/80' : 'bg-muted/60 hover:bg-muted/50'
                                        )}
                                    >
                                        {symbols[piece]}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPendingPromotion(null)}
                            className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {showResultModal && state.result?.isOver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl border border-border/50 animate-in fade-in zoom-in duration-200">
                        <div className="mb-6 text-center">
                            <div className="mb-4 inline-flex items-center justify-center">
                                {state.result.winner === state.playerColor ? (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 text-5xl">
                                        🏆
                                    </div>
                                ) : state.result.winner === 'draw' ? (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-500/20 text-5xl">
                                        🤝
                                    </div>
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-5xl">
                                        🤖
                                    </div>
                                )}
                            </div>
                            <h2 className="text-2xl font-bold">{getResultText()}</h2>
                            <p className="mt-1 text-muted-foreground">{getResultSubtext()}</p>
                        </div>

                        <div className="space-y-2">
                            <Button className="w-full" onClick={handleRematch}>
                                Rematch
                            </Button>
                            <Button variant="outline" className="w-full" onClick={handleNewGame}>
                                Change Settings
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => setShowResultModal(false)}
                            >
                                Review Game
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BotGamePage() {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading game…</p>
                </div>
            </div>
        }>
            <BotGameContent />
        </Suspense>
    );
}
