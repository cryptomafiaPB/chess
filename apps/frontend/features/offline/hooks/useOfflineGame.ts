// features/offline/hooks/useOfflineGame.ts
// Hook for managing offline bot games

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChessEngine, ChessBot, type ChessMove, type BotDifficulty, type GameResult, BOT_CONFIGS } from '@/lib/chess';

export type PlayerColor = 'white' | 'black';
export type GameStatus = 'idle' | 'playing' | 'finished';

export interface OfflineGameState {
    fen: string;
    status: GameStatus;
    playerColor: PlayerColor;
    botDifficulty: BotDifficulty;
    currentTurn: 'white' | 'black';
    result: GameResult | null;
    moveHistory: ChessMove[];
    lastMove: { from: string; to: string } | null;
    isCheck: boolean;
    checkSquare: string | null;
    isBotThinking: boolean;
}

export interface UseOfflineGameReturn {
    state: OfflineGameState;
    startGame: (playerColor: PlayerColor, difficulty: BotDifficulty) => void;
    makeMove: (from: string, to: string, promotion?: string) => boolean;
    getLegalMoves: (from?: string) => { from: string; to: string; san: string; promotion?: string }[];
    resign: () => void;
    offerDraw: () => void;
    resetGame: () => void;
    undoMove: () => void;
    canUndo: boolean;
}

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function useOfflineGame(): UseOfflineGameReturn {
    const engineRef = useRef<ChessEngine>(new ChessEngine());
    const botRef = useRef<ChessBot | null>(null);

    const [state, setState] = useState<OfflineGameState>({
        fen: INITIAL_FEN,
        status: 'idle',
        playerColor: 'white',
        botDifficulty: 3,
        currentTurn: 'white',
        result: null,
        moveHistory: [],
        lastMove: null,
        isCheck: false,
        checkSquare: null,
        isBotThinking: false,
    });

    // Find king square for check highlight
    const findKingSquare = useCallback((color: 'white' | 'black'): string | null => {
        return engineRef.current.findKingSquare(color);
    }, []);

    // Update state from engine
    const syncStateFromEngine = useCallback(() => {
        const engine = engineRef.current;
        const turn = engine.getTurn();
        const isCheck = engine.isCheck();
        const checkSquare = isCheck ? findKingSquare(turn) : null;
        const result = engine.getGameResult();
        const moveHistory = engine.getMoveHistoryVerbose();

        setState((prev) => ({
            ...prev,
            fen: engine.getFen(),
            currentTurn: turn,
            isCheck,
            checkSquare,
            result: result.isOver ? result : null,
            status: result.isOver ? 'finished' : prev.status,
            moveHistory,
            lastMove: moveHistory.length > 0
                ? { from: moveHistory[moveHistory.length - 1].from, to: moveHistory[moveHistory.length - 1].to }
                : null,
        }));

        return { turn, isOver: result.isOver };
    }, [findKingSquare]);

    // Bot makes a move
    const makeBotMove = useCallback(async () => {
        const bot = botRef.current;
        const engine = engineRef.current;

        if (!bot || engine.isGameOver()) return;

        setState((prev) => ({ ...prev, isBotThinking: true }));

        try {
            const move = await bot.getMove(engine);

            if (move && !engine.isGameOver()) {
                engine.makeMove(move);
                syncStateFromEngine();
            }
        } catch (error) {
            console.error('Bot move error:', error);
        } finally {
            setState((prev) => ({ ...prev, isBotThinking: false }));
        }
    }, [syncStateFromEngine]);

    // Check if it's bot's turn and trigger bot move
    useEffect(() => {
        if (
            state.status === 'playing' &&
            !state.result?.isOver &&
            state.currentTurn !== state.playerColor &&
            !state.isBotThinking
        ) {
            // Small delay before bot starts thinking
            const timeout = setTimeout(() => {
                makeBotMove();
            }, 100);

            return () => clearTimeout(timeout);
        }
    }, [state.status, state.result, state.currentTurn, state.playerColor, state.isBotThinking, makeBotMove]);

    // Start a new game
    const startGame = useCallback((playerColor: PlayerColor, difficulty: BotDifficulty) => {
        engineRef.current = new ChessEngine();
        botRef.current = new ChessBot(difficulty);

        setState({
            fen: INITIAL_FEN,
            status: 'playing',
            playerColor,
            botDifficulty: difficulty,
            currentTurn: 'white',
            result: null,
            moveHistory: [],
            lastMove: null,
            isCheck: false,
            checkSquare: null,
            isBotThinking: false,
        });

        // If player chose black, bot plays first
        if (playerColor === 'black') {
            setTimeout(() => {
                makeBotMove();
            }, 500);
        }
    }, [makeBotMove]);

    // Make a player move
    const makeMove = useCallback((from: string, to: string, promotion?: string): boolean => {
        const engine = engineRef.current;

        // Check if it's player's turn
        if (state.currentTurn !== state.playerColor) {
            return false;
        }

        // Attempt the move
        const result = engine.makeMove({ from, to, promotion });

        if (result) {
            syncStateFromEngine();
            return true;
        }

        return false;
    }, [state.currentTurn, state.playerColor, syncStateFromEngine]);

    // Get legal moves
    const getLegalMoves = useCallback((from?: string) => {
        const engine = engineRef.current;

        if (from) {
            return engine.getLegalMovesFrom(from).map((m) => ({
                from: m.from,
                to: m.to,
                san: m.san,
                promotion: m.promotion,
            }));
        }

        return engine.getLegalMoves().map((m) => ({
            from: m.from,
            to: m.to,
            san: m.san,
            promotion: m.promotion,
        }));
    }, []);

    // Resign
    const resign = useCallback(() => {
        setState((prev) => ({
            ...prev,
            status: 'finished',
            result: {
                isOver: true,
                winner: prev.playerColor === 'white' ? 'black' : 'white',
                reason: 'checkmate', // Using checkmate as resignation equivalent
            },
        }));
    }, []);

    // Offer draw (in bot games, bot will accept/decline based on position)
    const offerDraw = useCallback(() => {
        // For simplicity, bot accepts draw if position is even
        // In a real implementation, this could be more sophisticated
        setState((prev) => ({
            ...prev,
            status: 'finished',
            result: {
                isOver: true,
                winner: 'draw',
                reason: 'draw',
            },
        }));
    }, []);

    // Reset game
    const resetGame = useCallback(() => {
        engineRef.current = new ChessEngine();
        botRef.current = null;

        setState({
            fen: INITIAL_FEN,
            status: 'idle',
            playerColor: 'white',
            botDifficulty: 3,
            currentTurn: 'white',
            result: null,
            moveHistory: [],
            lastMove: null,
            isCheck: false,
            checkSquare: null,
            isBotThinking: false,
        });
    }, []);

    // Undo move (undo player's last move and bot's response)
    const undoMove = useCallback(() => {
        const engine = engineRef.current;

        if (state.moveHistory.length === 0) return;
        if (state.isBotThinking) return;

        // Undo bot's move
        if (state.currentTurn === state.playerColor && state.moveHistory.length >= 2) {
            engine.undo();
            engine.undo();
        } else if (state.currentTurn !== state.playerColor && state.moveHistory.length >= 1) {
            // If it's bot's turn, just undo player's last move
            engine.undo();
        }

        syncStateFromEngine();
    }, [state.moveHistory.length, state.currentTurn, state.playerColor, state.isBotThinking, syncStateFromEngine]);

    const canUndo = useMemo(() => {
        return (
            state.status === 'playing' &&
            state.moveHistory.length > 0 &&
            !state.isBotThinking &&
            state.currentTurn === state.playerColor
        );
    }, [state.status, state.moveHistory.length, state.isBotThinking, state.currentTurn, state.playerColor]);

    return {
        state,
        startGame,
        makeMove,
        getLegalMoves,
        resign,
        offerDraw,
        resetGame,
        undoMove,
        canUndo,
    };
}
