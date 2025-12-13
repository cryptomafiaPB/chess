// board.ts
import { Chess } from "chess.js";
import type { Move } from "./move";
import { Color } from "types/chess";


export interface LegalMoveHint {
    from: string;
    to: string;
    san: string;
    promotion?: string;
}


export class Board {
    private chess: Chess;

    constructor(fen?: string) {
        this.chess = new Chess();
        if (fen) {
            this.chess.load(fen);
        }
    }

    load(fen: string) {
        this.chess.load(fen);
    }

    getFen(): string {
        return this.chess.fen();
    }

    makeMove(move: Move): boolean {
        try {
            const legalMoves = this.chess.moves({ square: move.from as any, verbose: true });
            const targetLegal = legalMoves.some(
                (m: any) =>
                    m.to === move.to &&
                    (!move.promotion || m.promotion === move.promotion)
            );
            if (!targetLegal) {
                return false;
            }

            const moveResult = this.chess.move({
                from: move.from,
                to: move.to,
                ...(move.promotion && { promotion: move.promotion }),
            });

            return moveResult !== null;
        } catch (e) {
            return false;
        }
    }

    getPieceColorAt(square: string): Color | null {
        const piece = this.chess.get(square as any);
        if (!piece) return null;
        return piece.color === "w" ? Color.WHITE : Color.BLACK;
    }

    undoMove() {
        this.chess.undo();
    }

    getLegalMoves(from?: string): string[] {
        return this.chess
            .moves({ square: from as any, verbose: true })
            .map((m: any) => m.san);
    }

    isGameOver(): boolean {
        return this.chess.isGameOver();
    }

    isCheckmate(): boolean {
        return this.chess.isCheckmate();
    }

    isDraw(): boolean {
        return (
            this.chess.isDraw() ||
            this.chess.isStalemate() ||
            this.chess.isThreefoldRepetition() ||
            this.chess.isInsufficientMaterial()
        );
    }

    isStalemate(): boolean {
        return this.chess.isStalemate();
    }

    getTurnColor(): Color {
        return this.chess.turn() === "w" ? Color.WHITE : Color.BLACK;
    }

    getLegalMovesFrom(square?: string): LegalMoveHint[] {
        const moves = this.chess.moves({
            square: square as any,
            verbose: true
        });

        return moves.map((m: any) => ({
            from: m.from,
            to: m.to,
            san: m.san,
            promotion: m.promotion
        }));
    }
}
