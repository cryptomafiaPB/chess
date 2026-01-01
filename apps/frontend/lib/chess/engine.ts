// lib/chess/engine.ts
// Client-side chess engine for offline play - wraps chess.js

import { Chess, type Move as ChessJsMove, type Square, type PieceSymbol, type Color } from 'chess.js';

export interface ChessMove {
    from: string;
    to: string;
    promotion?: string;
    san?: string;
    piece?: string;
    captured?: string;
    flags?: string;
}

export interface GameResult {
    isOver: boolean;
    winner: 'white' | 'black' | 'draw' | null;
    reason: 'checkmate' | 'stalemate' | 'draw' | 'insufficient' | 'threefold' | 'fifty-move' | null;
}

export interface LegalMove {
    from: string;
    to: string;
    san: string;
    promotion?: string;
    piece: string;
    flags: string;
}

export class ChessEngine {
    private chess: Chess;

    constructor(fen?: string) {
        this.chess = new Chess();
        if (fen) {
            this.chess.load(fen);
        }
    }

    /**
     * Load a position from FEN
     */
    load(fen: string): boolean {
        try {
            this.chess.load(fen);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Reset to starting position
     */
    reset(): void {
        this.chess.reset();
    }

    /**
     * Get current FEN
     */
    getFen(): string {
        return this.chess.fen();
    }

    /**
     * Get current turn
     */
    getTurn(): 'white' | 'black' {
        return this.chess.turn() === 'w' ? 'white' : 'black';
    }

    /**
     * Make a move
     */
    makeMove(move: ChessMove): ChessMove | null {
        try {
            const result = this.chess.move({
                from: move.from as Square,
                to: move.to as Square,
                promotion: move.promotion as PieceSymbol | undefined,
            });

            if (result) {
                return {
                    from: result.from,
                    to: result.to,
                    promotion: result.promotion,
                    san: result.san,
                    piece: result.piece,
                    captured: result.captured,
                    flags: result.flags,
                };
            }
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Undo last move
     */
    undo(): ChessMove | null {
        const result = this.chess.undo();
        if (result) {
            return {
                from: result.from,
                to: result.to,
                san: result.san,
                piece: result.piece,
                captured: result.captured,
            };
        }
        return null;
    }

    /**
     * Get all legal moves
     */
    getLegalMoves(): LegalMove[] {
        const moves = this.chess.moves({ verbose: true });
        return moves.map((m) => ({
            from: m.from,
            to: m.to,
            san: m.san,
            promotion: m.promotion,
            piece: m.piece,
            flags: m.flags,
        }));
    }

    /**
     * Get legal moves from a specific square
     */
    getLegalMovesFrom(square: string): LegalMove[] {
        try {
            const moves = this.chess.moves({ square: square as Square, verbose: true });
            return moves.map((m) => ({
                from: m.from,
                to: m.to,
                san: m.san,
                promotion: m.promotion,
                piece: m.piece,
                flags: m.flags,
            }));
        } catch {
            return [];
        }
    }

    /**
     * Check if a move is legal
     */
    isLegalMove(from: string, to: string, promotion?: string): boolean {
        const moves = this.getLegalMovesFrom(from);
        return moves.some(
            (m) => m.to === to && (!promotion || m.promotion === promotion)
        );
    }

    /**
     * Check if move needs promotion
     */
    needsPromotion(from: string, to: string): boolean {
        const moves = this.getLegalMovesFrom(from);
        return moves.some((m) => m.to === to && m.flags.includes('p'));
    }

    /**
     * Get game result
     */
    getGameResult(): GameResult {
        if (!this.chess.isGameOver()) {
            return { isOver: false, winner: null, reason: null };
        }

        if (this.chess.isCheckmate()) {
            const winner = this.chess.turn() === 'w' ? 'black' : 'white';
            return { isOver: true, winner, reason: 'checkmate' };
        }

        if (this.chess.isStalemate()) {
            return { isOver: true, winner: 'draw', reason: 'stalemate' };
        }

        if (this.chess.isThreefoldRepetition()) {
            return { isOver: true, winner: 'draw', reason: 'threefold' };
        }

        if (this.chess.isInsufficientMaterial()) {
            return { isOver: true, winner: 'draw', reason: 'insufficient' };
        }

        if (this.chess.isDraw()) {
            return { isOver: true, winner: 'draw', reason: 'fifty-move' };
        }

        return { isOver: true, winner: 'draw', reason: 'draw' };
    }

    /**
     * Check if in check
     */
    isCheck(): boolean {
        return this.chess.isCheck();
    }

    /**
     * Check if game is over
     */
    isGameOver(): boolean {
        return this.chess.isGameOver();
    }

    /**
     * Get piece at square
     */
    getPiece(square: string): { type: string; color: 'white' | 'black' } | null {
        const piece = this.chess.get(square as Square);
        if (!piece) return null;
        return {
            type: piece.type,
            color: piece.color === 'w' ? 'white' : 'black',
        };
    }

    /**
     * Get the board as 2D array
     */
    getBoard(): (({ type: PieceSymbol; color: Color } | null)[])[] {
        return this.chess.board();
    }

    /**
     * Find the king square for a color
     */
    findKingSquare(color: 'white' | 'black'): string | null {
        const colorChar = color === 'white' ? 'w' : 'b';
        const board = this.chess.board();
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece?.type === 'k' && piece.color === colorChar) {
                    const file = String.fromCharCode(97 + col);
                    const rank = 8 - row;
                    return `${file}${rank}`;
                }
            }
        }
        return null;
    }

    /**
     * Get move history
     */
    getMoveHistory(): string[] {
        return this.chess.history();
    }

    /**
     * Get move history with full details
     */
    getMoveHistoryVerbose(): ChessMove[] {
        return this.chess.history({ verbose: true }).map((m) => ({
            from: m.from,
            to: m.to,
            san: m.san,
            piece: m.piece,
            captured: m.captured,
            promotion: m.promotion,
            flags: m.flags,
        }));
    }

    /**
     * Get PGN of the game
     */
    getPgn(): string {
        return this.chess.pgn();
    }

    /**
     * Clone the engine state
     */
    clone(): ChessEngine {
        return new ChessEngine(this.getFen());
    }
}

// Export singleton for quick access
export const createChessEngine = (fen?: string) => new ChessEngine(fen);
