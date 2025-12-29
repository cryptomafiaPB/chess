'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocketClient } from '@/lib/socket-client';
import { Chess } from 'chess.js';

export interface MoveEntry {
    moveNumber: number;
    white?: { san: string; from: string; to: string };
    black?: { san: string; from: string; to: string };
}

interface RawMove {
    from: string;
    to: string;
    promotion?: string | null;
}

/**
 * Hook to track move history for a game.
 * Reconstructs SAN notation from FEN positions.
 */
export function useMoveHistory(gameId: string, initialFen?: string) {
    const [moves, setMoves] = useState<MoveEntry[]>([]);
    const chessRef = useRef<Chess>(new Chess());
    const isInitializedRef = useRef(false);

    // Reset when game changes
    useEffect(() => {
        setMoves([]);
        chessRef.current = new Chess();
        isInitializedRef.current = false;
    }, [gameId]);

    useEffect(() => {
        const socket = getSocketClient();

        // When we receive the initial game state
        const handleState = (payload: any) => {
            if (payload.gameId !== gameId) return;

            // Reset chess instance
            chessRef.current = new Chess();
            isInitializedRef.current = true;

            // If there's a move in the initial state, we need to reconstruct history
            // For now, just set up from the starting position
            // The moves will be added as they come in
            setMoves([]);
        };

        // When a move is made
        const handleMove = (payload: any) => {
            if (payload.gameId !== gameId) return;
            if (!payload.move) return;

            const move: RawMove = payload.move;

            try {
                // Get current position before making move
                const chess = chessRef.current;
                const turn = chess.turn(); // 'w' or 'b'
                const fullMoveNumber = Math.floor(chess.history().length / 2) + 1;

                // Make the move to get SAN notation
                const result = chess.move({
                    from: move.from,
                    to: move.to,
                    promotion: move.promotion || undefined
                });

                if (!result) {
                    // If move fails, try to sync from FEN
                    if (payload.fen) {
                        chess.load(payload.fen);
                    }
                    return;
                }

                const san = result.san;
                const moveNumber = turn === 'w' ? fullMoveNumber : fullMoveNumber;

                setMoves(prev => {
                    const newMoves = [...prev];

                    if (turn === 'w') {
                        // White's move - add new entry
                        newMoves.push({
                            moveNumber,
                            white: { san, from: move.from, to: move.to }
                        });
                    } else {
                        // Black's move - update last entry
                        if (newMoves.length > 0) {
                            const lastEntry = newMoves[newMoves.length - 1];
                            if (!lastEntry.black) {
                                newMoves[newMoves.length - 1] = {
                                    ...lastEntry,
                                    black: { san, from: move.from, to: move.to }
                                };
                            } else {
                                // Edge case: create new entry
                                newMoves.push({
                                    moveNumber,
                                    black: { san, from: move.from, to: move.to }
                                });
                            }
                        } else {
                            // No white move yet (shouldn't happen in normal game)
                            newMoves.push({
                                moveNumber,
                                black: { san, from: move.from, to: move.to }
                            });
                        }
                    }

                    return newMoves;
                });
            } catch (err) {
                console.error('Error processing move for history:', err);
                // Try to recover by loading the FEN
                if (payload.fen) {
                    try {
                        chessRef.current.load(payload.fen);
                    } catch (e) {
                        console.error('Failed to load FEN:', e);
                    }
                }
            }
        };

        socket.on('game:state', handleState);
        socket.on('game:move', handleMove);

        return () => {
            socket.off('game:state', handleState);
            socket.off('game:move', handleMove);
        };
    }, [gameId]);

    const clearHistory = useCallback(() => {
        setMoves([]);
        chessRef.current = new Chess();
        isInitializedRef.current = false;
    }, []);

    return {
        moves,
        clearHistory
    };
}
