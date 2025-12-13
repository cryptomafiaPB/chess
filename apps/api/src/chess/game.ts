// game.ts
import { Color } from "types/chess";
import { Board, type LegalMoveHint } from "./board";
import { MoveHistory } from "./moveHistory";
import type { Player } from "./player";
import type { Move } from "./move";

export class Game {
    private board: Board;
    private moveHistory: MoveHistory;
    private players: Map<Color, Player>;
    private currentTurn: Color;
    private isGameOver: boolean = false;
    private winner: Color | null = null;

    constructor(playerWhite: Player, playerBlack: Player, fen?: string) {
        this.players = new Map<Color, Player>([
            [Color.WHITE, playerWhite],
            [Color.BLACK, playerBlack],
        ]);
        this.board = new Board(fen);
        this.moveHistory = new MoveHistory();
        this.currentTurn = Color.WHITE;
    }

    static fromFen(
        playerWhite: Player,
        playerBlack: Player,
        fen: string
    ): Game {
        return new Game(playerWhite, playerBlack, fen);
    }

    playMove(move: Move): boolean {
        if (this.isGameOver) return false;

        const pieceColor = this.board.getPieceColorAt(move.from);
        if (pieceColor !== this.currentTurn) return false;

        const moveMade = this.board.makeMove(move);
        if (!moveMade) return false;

        this.moveHistory.addMove(move);

        if (this.board.isCheckmate()) {
            this.isGameOver = true;
            this.winner =
                this.currentTurn === Color.WHITE ? Color.BLACK : Color.WHITE;
        } else if (this.board.isDraw() || this.board.isStalemate()) {
            this.isGameOver = true;
            this.winner = null;
        } else {
            this.toggleTurn();
        }

        return true;
    }

    toggleTurn() {
        this.currentTurn =
            this.currentTurn === Color.WHITE ? Color.BLACK : Color.WHITE;
    }

    getCurrentTurn(): Color {
        return this.currentTurn;
    }

    getWinner(): Color | null {
        return this.winner;
    }

    getMoveHistory(): Move[] {
        return this.moveHistory.getMoves();
    }

    getBoardFen(): string {
        return this.board.getFen();
    }

    isOver(): boolean {
        return this.isGameOver;
    }

    getLegalMoves(from?: string): LegalMoveHint[] {
        return this.board.getLegalMovesFrom(from);
    }
}
