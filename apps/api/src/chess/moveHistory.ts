import type { Move } from "./move";

// Manages the history of moves, useful for undo/redo
export class MoveHistory {
    private history: Move[] = [];
    private currentIndex: number = -1;

    addMove(move: Move) {
        // If we are not at the end, discard forward history (for redo logic)
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        this.history.push(move);
        this.currentIndex++;
    }

    undo(): Move | null {
        if (this.currentIndex < 0) return null;
        return this.history[this.currentIndex--] ?? null;
    }

    redo(): Move | null {
        if (this.currentIndex >= this.history.length - 1) return null;
        return this.history[++this.currentIndex] || null;
    }

    getMoves(): Move[] {
        return this.history.slice(0, this.currentIndex + 1);
    }
}