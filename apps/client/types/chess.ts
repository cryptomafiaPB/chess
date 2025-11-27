export type PieceColor = 'w' | 'b';
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
export type Piece = `${PieceColor}${PieceType}` | null;
export type Board = Piece[][];
export type Position = { row: number; col: number };
