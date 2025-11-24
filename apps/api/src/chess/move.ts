// Represents a single chess move
export class Move {
    constructor(
        public from: string, // e.g. "e2"
        public to: string,   // e.g. "e4"
        public promotion?: string // Optional promotion piece type (e.g. "q")
    ) { }
}