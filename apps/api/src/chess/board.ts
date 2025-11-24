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
        const moveResult = this.chess.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion,
        });
        return moveResult !== null;
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
        return this.chess.game_over();
    }

    isCheckmate(): boolean {
        return this.chess.in_checkmate();
    }

    isDraw(): boolean {
        return this.chess.in_draw();
    }

    isStalemate(): boolean {
        return this.chess.in_stalemate();
    }
}
