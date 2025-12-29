'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocketClient } from '@/lib/socket-client';
import { Chess, Move as ChessMove } from 'chess.js';

export type GameRole = 'white' | 'black' | 'spectator';
export type PresenceStatus = 'online' | 'offline';

export interface ClockState {
    white: number;
    black: number;
    increment?: number;
    lastMoveAt?: number;
    activeColor?: 'white' | 'black';
}

export interface MoveInfo {
    from: string;
    to: string;
    san: string;
    promotion?: string | null;
}

export interface MoveEntry {
    moveNumber: number;
    white?: { san: string; from: string; to: string };
    black?: { san: string; from: string; to: string };
}

// Server sends flat array of moves
interface ServerMove {
    from: string;
    to: string;
    san: string;
    promotion?: string;
}

export type GameErrorType = 'not_found' | 'expired' | 'error';

export interface GameState {
    gameId: string;
    fen: string;
    role: GameRole;
    status: 'waiting' | 'active' | 'completed' | 'aborted';
    result?: string | null;
    resultReason?: string | null;
    clocks: ClockState;
    lastMove?: MoveInfo | null;
    presence: {
        white: PresenceStatus;
        black: PresenceStatus;
    };
    isExpired?: boolean; // True if game data has expired from Redis
}

interface OptimisticMoveResult {
    success: boolean;
    san?: string;
    fen?: string;
    error?: string;
    isPromotion?: boolean;
}

interface GameError {
    message: string;
    type: GameErrorType;
}

/**
 * Hook that provides optimistic game state management.
 * Moves are validated and applied locally first, then synced with server.
 * This provides instant feedback to users while maintaining server authority.
 */
export function useOptimisticGame(gameId: string) {
    const [state, setState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<GameError | null>(null);
    const [moveHistory, setMoveHistory] = useState<MoveEntry[]>([]);

    // Chess.js instance for local validation
    const chessRef = useRef<Chess>(new Chess());

    // Track pending optimistic moves for potential rollback
    const pendingMoveRef = useRef<{
        previousFen: string;
        previousRawMoves: ServerMove[];
        move: MoveInfo;
    } | null>(null);

    // Sync chess.js state with current FEN
    const syncChessState = useCallback((fen: string) => {
        try {
            chessRef.current.load(fen);
        } catch (e) {
            console.error('Failed to load FEN:', e);
        }
    }, []);

    // Convert flat array of moves to MoveEntry format
    const buildMoveEntries = useCallback((moves: ServerMove[]): MoveEntry[] => {
        const entries: MoveEntry[] = [];

        for (let i = 0; i < moves.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moves[i];
            const blackMove = moves[i + 1];

            entries.push({
                moveNumber,
                white: whiteMove ? { san: whiteMove.san, from: whiteMove.from, to: whiteMove.to } : undefined,
                black: blackMove ? { san: blackMove.san, from: blackMove.from, to: blackMove.to } : undefined,
            });
        }

        return entries;
    }, []);

    // Keep track of raw moves for adding new ones
    const rawMovesRef = useRef<ServerMove[]>([]);

    // Add a new move to history
    const addMoveToHistory = useCallback((move: ServerMove) => {
        rawMovesRef.current = [...rawMovesRef.current, move];
        setMoveHistory(buildMoveEntries(rawMovesRef.current));
    }, [buildMoveEntries]);

    // Validate and apply move locally (optimistic)
    const tryLocalMove = useCallback((from: string, to: string, promotion?: string): OptimisticMoveResult => {
        const chess = chessRef.current;

        // Check if this is a promotion move that needs user input
        const piece = chess.get(from as any);
        if (piece?.type === 'p') {
            const toRank = parseInt(to[1], 10);
            const isPromotion = (piece.color === 'w' && toRank === 8) || (piece.color === 'b' && toRank === 1);
            if (isPromotion && !promotion) {
                return { success: false, isPromotion: true };
            }
        }

        try {
            const move = chess.move({
                from,
                to,
                promotion: promotion || undefined,
            });

            if (!move) {
                return { success: false, error: 'Invalid move' };
            }

            return {
                success: true,
                san: move.san,
                fen: chess.fen(),
            };
        } catch (e) {
            return { success: false, error: e instanceof Error ? e.message : 'Invalid move' };
        }
    }, []);

    // Apply optimistic move to state
    const applyOptimisticMove = useCallback((move: MoveInfo, newFen: string) => {
        setState(prev => {
            if (!prev) return prev;

            const currentTurn = prev.clocks.activeColor ?? 'white';
            const nextTurn: 'white' | 'black' = currentTurn === 'white' ? 'black' : 'white';

            return {
                ...prev,
                fen: newFen,
                lastMove: move,
                clocks: {
                    ...prev.clocks,
                    activeColor: nextTurn,
                },
            };
        });

        // Add move to history optimistically
        addMoveToHistory({
            from: move.from,
            to: move.to,
            san: move.san,
            promotion: move.promotion ?? undefined,
        });
    }, [addMoveToHistory]);

    // Rollback optimistic move on server rejection
    const rollbackMove = useCallback(() => {
        const pending = pendingMoveRef.current;
        if (!pending) return;

        // Restore previous state
        syncChessState(pending.previousFen);

        // Restore raw moves and rebuild history
        rawMovesRef.current = pending.previousRawMoves;
        setMoveHistory(buildMoveEntries(rawMovesRef.current));

        setState(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                fen: pending.previousFen,
            };
        });

        pendingMoveRef.current = null;
        setError({ message: 'Move rejected by server. State restored.', type: 'error' });

        // Clear error after a moment
        setTimeout(() => setError(null), 3000);
    }, [syncChessState, buildMoveEntries]);

    // Main move function with optimistic updates
    const makeMove = useCallback((from: string, to: string, promotion?: string): OptimisticMoveResult => {
        if (!state) return { success: false, error: 'Game not loaded' };

        // Store current state for potential rollback
        const previousFen = chessRef.current.fen();
        const previousRawMoves = [...rawMovesRef.current];

        // Try local validation
        const result = tryLocalMove(from, to, promotion);

        if (result.isPromotion) {
            return result; // Let caller handle promotion UI
        }

        if (!result.success) {
            setError({ message: result.error || 'Invalid move', type: 'error' });
            setTimeout(() => setError(null), 2000);
            return result;
        }

        // Store pending move for potential rollback
        pendingMoveRef.current = {
            previousFen,
            previousRawMoves,
            move: { from, to, san: result.san!, promotion },
        };

        // Apply optimistic update immediately
        applyOptimisticMove(
            { from, to, san: result.san!, promotion },
            result.fen!
        );

        // Send to server (fire-and-forget style)
        const socket = getSocketClient();
        socket.emit('game:move', { gameId, from, to, promotion });

        return result;
    }, [state, gameId, moveHistory, tryLocalMove, applyOptimisticMove]);

    // Get legal moves for a square (for hints)
    const getLegalMoves = useCallback((from: string): string[] => {
        const chess = chessRef.current;
        try {
            const moves = chess.moves({ square: from as any, verbose: true });
            return moves.map(m => m.to);
        } catch {
            return [];
        }
    }, []);

    // Check if a move is legal
    const isMoveLegal = useCallback((from: string, to: string): boolean => {
        const legalMoves = getLegalMoves(from);
        return legalMoves.includes(to);
    }, [getLegalMoves]);

    // Socket event handlers
    useEffect(() => {
        const socket = getSocketClient();
        setLoading(true);
        setError(null);

        const handleState = (payload: any) => {
            const fen = payload.fen;
            syncChessState(fen);

            const next: GameState = {
                gameId: payload.gameId,
                fen,
                role: payload.role,
                status: payload.status,
                result: payload.result,
                resultReason: payload.resultReason,
                clocks: {
                    white: payload.clocks?.white ?? 0,
                    black: payload.clocks?.black ?? 0,
                    increment: payload.clocks?.increment,
                    lastMoveAt: payload.clocks?.lastMoveAt,
                    activeColor: payload.clocks?.activeColor,
                },
                lastMove: payload.move ?? null,
                presence: {
                    white: payload.presence?.white ?? 'online',
                    black: payload.presence?.black ?? 'online',
                },
                isExpired: payload.isExpired ?? false,
            };

            setState(next);

            // Use move history from server
            const serverMoves: ServerMove[] = payload.moveHistory ?? [];
            rawMovesRef.current = serverMoves;
            setMoveHistory(buildMoveEntries(serverMoves));

            setLoading(false);
            setError(null); // Clear any previous errors
            pendingMoveRef.current = null; // Clear any pending moves on full state sync
        };

        const handleMove = (payload: any) => {
            if (payload.gameId !== gameId) return;

            // If this is confirmation of our optimistic move
            if (pendingMoveRef.current) {
                const pending = pendingMoveRef.current;

                // Verify server agrees with our move
                if (payload.fen === chessRef.current.fen()) {
                    // Server confirmed our optimistic move - just clear pending
                    pendingMoveRef.current = null;

                    // Update clocks from server (authoritative)
                    setState(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            status: payload.gameOver ? 'completed' : prev.status,
                            result: payload.result ?? prev.result,
                            resultReason: payload.resultReason ?? prev.resultReason,
                            clocks: {
                                white: payload.clocks?.white ?? prev.clocks.white,
                                black: payload.clocks?.black ?? prev.clocks.black,
                                increment: payload.clocks?.increment ?? prev.clocks.increment,
                                lastMoveAt: payload.clocks?.lastMoveAt ?? prev.clocks.lastMoveAt,
                                activeColor: payload.clocks?.activeColor ?? prev.clocks.activeColor,
                            },
                        };
                    });
                    return;
                }
            }

            // This is opponent's move or server correction - apply it
            syncChessState(payload.fen);

            // Add move to history (opponent's move)
            const moveData = payload.move;
            if (moveData) {
                addMoveToHistory({
                    from: moveData.from,
                    to: moveData.to,
                    san: moveData.san || '',
                    promotion: moveData.promotion
                });
            }

            setState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    fen: payload.fen,
                    status: payload.gameOver ? 'completed' : prev.status,
                    result: payload.result ?? prev.result,
                    resultReason: payload.resultReason ?? prev.resultReason,
                    lastMove: moveData ? {
                        from: moveData.from,
                        to: moveData.to,
                        san: moveData.san || '',
                        promotion: moveData.promotion,
                    } : prev.lastMove,
                    clocks: {
                        white: payload.clocks?.white ?? prev.clocks.white,
                        black: payload.clocks?.black ?? prev.clocks.black,
                        increment: payload.clocks?.increment ?? prev.clocks.increment,
                        lastMoveAt: payload.clocks?.lastMoveAt ?? prev.clocks.lastMoveAt,
                        activeColor: payload.clocks?.activeColor ?? prev.clocks.activeColor,
                    },
                };
            });

            pendingMoveRef.current = null;
        };

        const handleEnded = (payload: any) => {
            if (payload.gameId !== gameId) return;
            setState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    status: 'completed',
                    result: payload.result,
                    resultReason: payload.resultReason,
                };
            });
            pendingMoveRef.current = null;
        };

        const handlePresence = (payload: {
            gameId: string;
            userId: string;
            role: 'white' | 'black';
            status: PresenceStatus;
        }) => {
            if (payload.gameId !== gameId) return;
            setState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    presence: {
                        ...prev.presence,
                        [payload.role]: payload.status,
                    },
                };
            });
        };

        const handleError = (payload: any) => {
            const errorType = payload.type ?? 'error';
            setError({
                message: payload.message ?? 'Game error',
                type: errorType as GameErrorType
            });
            setLoading(false);
        };

        const handleInvalidMove = (payload: any) => {
            if (payload.gameId !== gameId) return;
            // Server rejected our move - rollback
            rollbackMove();
        };

        // Handle game:begin event - game starts when both players are ready
        const handleGameBegin = (payload: any) => {
            if (payload.gameId !== gameId) return;
            setState(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    status: 'active',
                    clocks: {
                        ...prev.clocks,
                        lastMoveAt: payload.startTime,
                    },
                };
            });
        };

        // IMPORTANT: Set up listeners BEFORE emitting game:join to avoid race conditions
        socket.on('game:state', handleState);
        socket.on('game:move', handleMove);
        socket.on('game:ended', handleEnded);
        socket.on('game:presence', handlePresence);
        socket.on('game:error', handleError);
        socket.on('game:invalid-move', handleInvalidMove);
        socket.on('game:begin', handleGameBegin);

        // Now emit join after listeners are ready
        socket.emit('game:join', { gameId });

        return () => {
            socket.off('game:state', handleState);
            socket.off('game:move', handleMove);
            socket.off('game:ended', handleEnded);
            socket.off('game:presence', handlePresence);
            socket.off('game:error', handleError);
            socket.off('game:invalid-move', handleInvalidMove);
            socket.off('game:begin', handleGameBegin);
        };
    }, [gameId, syncChessState, buildMoveEntries, addMoveToHistory, rollbackMove]);

    const resign = useCallback(() => {
        const socket = getSocketClient();
        socket.emit('game:resign', { gameId });
    }, [gameId]);

    return {
        state,
        loading,
        error,
        moveHistory,
        makeMove,
        getLegalMoves,
        isMoveLegal,
        resign,
    };
}
