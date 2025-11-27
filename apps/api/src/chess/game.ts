import { Color } from "types/chess";
import { Board } from "./board";
import { MoveHistory } from "./moveHistory";
import type { Player } from "./player";
import type { Move } from "./move";

// Main game class managing players, board, moves and game state
export class Game {
    private board: Board;
    private moveHistory: MoveHistory;
    private players: Map<Color, Player>;
    private currentTurn: Color;
    private isGameOver: boolean = false;
    private winner: Color | null = null;

    constructor(playerWhite: Player, playerBlack: Player) {
        this.players = new Map<Color, Player>([
            [Color.WHITE, playerWhite],
            [Color.BLACK, playerBlack],
        ]);
        this.board = new Board();
        this.moveHistory = new MoveHistory();
        this.currentTurn = Color.WHITE;
    }

    // Process a move; returns true if successful
    playMove(move: Move): boolean {
        if (this.isGameOver) return false;
        console.log("Processing move:", move);
        const pieceColor = this.board.getPieceColorAt(move.from);
        console.log("Piece color at", move.from, "is", pieceColor);
        if (pieceColor !== this.currentTurn) return false;

        const moveMade = this.board.makeMove(move);
        if (!moveMade) return false;

        this.moveHistory.addMove(move);
        this.toggleTurn();

        if (this.board.isCheckmate()) {
            this.isGameOver = true;
            this.winner = this.currentTurn === Color.WHITE ? Color.BLACK : Color.WHITE;
        } else if (this.board.isDraw() || this.board.isStalemate()) {
            this.isGameOver = true;
            this.winner = null;
        }
        return true;
    }

    toggleTurn() {
        this.currentTurn = this.currentTurn === Color.WHITE ? Color.BLACK : Color.WHITE;
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
}