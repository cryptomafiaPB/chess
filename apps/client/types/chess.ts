export type PieceColor = 'w' | 'b';
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type Piece = `${PieceColor}${PieceType}` | null;
export type Board = Piece[][];

export type Position = { row: number; col: number };


export interface UiMove {
    san: string;      // "e4", "Nf3", etc.
    from: string;     // "e2"
    to: string;       // "e4"
    moveNumber: number;
    color: 'w' | 'b';
}
