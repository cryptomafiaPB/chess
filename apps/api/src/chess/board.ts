import { Chess } from "chess.js";
import type { Move } from "./move";
import { Color } from "types/chess";

// Represents the chessboard and delegates rule validation and state management to chess.js
export class Board {
    private chess: any;

    constructor() {
        this.chess = new Chess();
    }

    // Load board from FEN string
    load(fen: string) {
        this.chess.load(fen);
    }

    // Get current board state in FEN notation
    getFen(): string {
        return this.chess.fen();
    }

    // Validates and makes a move, returns true if the move was successful
    makeMove(move: Move): boolean {
        // Check legal moves for this square first to avoid exceptions from chess.js
        try {
            const legalMoves = this.chess.moves({ square: move.from, verbose: true });
            const targetLegal = legalMoves.some((m: any) => m.to === move.to && (!move.promotion || m.promotion === move.promotion));
            if (!targetLegal) {
                console.warn(`Illegal move attempted from ${move.from} to ${move.to}`);
                return false;
            }

            const moveResult = this.chess.move({
                from: move.from,
                to: move.to,
                promotion: move.promotion,
            });
            console.log("Move result:", move);
            return moveResult !== null;
        } catch (e) {
            // chess.js can throw for malformed or illegal moves; handle gracefully
            console.error("Error while attempting move:", e, move);
            return false;
        }
    }

    getPieceColorAt(square: string): Color | null {
        const piece = this.chess.get(square); // chess.js get returns piece object
        if (!piece) return null;
        return piece.color === 'w' ? Color.WHITE : Color.BLACK;
    }

    // Undo last move
    undoMove() {
        this.chess.undo();
    }

    // Get list of legal moves in UCI notation
    getLegalMoves(from?: string): string[] {
        return this.chess.moves({ square: from, verbose: true }).map((m: any) => m.san);
    }

    // Check game status: checkmate, draw, stalemate
    isGameOver(): boolean {
        return this.chess.isGameOver();
    }

    isCheckmate(): boolean {
        return this.chess.isCheck();
    }

    isDraw(): boolean {
        return this.chess.isDraw();
    }

    isStalemate(): boolean {
        return this.chess.isStalemate();
    }
}
