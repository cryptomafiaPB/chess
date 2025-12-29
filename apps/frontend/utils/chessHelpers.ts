// utils/chessHelpers.ts
import type { Board, Piece, PieceType, Position } from '@/types/chess';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const indexToSquare = (pos: Position): string => {
    const file = FILES[pos.col];
    const rank = RANKS[pos.row];
    return `${file}${rank}`;
};

export const squareToIndex = (square: string): Position => {
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = 8 - parseInt(square[1], 10);
    return { row: rank, col: file };
};

export const fenToBoard = (fen: string): Board => {
    const placement = fen.split(' ')[0];
    const rows = placement.split('/');
    const board: Board = [];

    for (const row of rows) {
        const boardRow: Piece[] = [];
        for (const char of row) {
            if (/\d/.test(char)) {
                const emptyCount = parseInt(char, 10);
                for (let i = 0; i < emptyCount; i++) {
                    boardRow.push(null);
                }
            } else {
                const color = char === char.toUpperCase() ? 'w' : 'b';
                const type = char.toUpperCase() as PieceType;
                boardRow.push(`${color}${type}` as Piece);
            }
        }
        board.push(boardRow);
    }
    return board;
};

export const getSquareColor = (row: number, col: number): string =>
    (row + col) % 2 === 0 ? 'bg-[#F0D9B5]' : 'bg-[#B58863]';

export const getSquareColorWithSan = (san: string): string => {
    const file = san.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = 8 - parseInt(san[1], 10);
    return getSquareColor(rank, file);
};

export const getSideToMoveFromFen = (fen: string): 'white' | 'black' => {
    const parts = fen.split(' ');
    const token = parts[1]?.trim().toLowerCase();
    return token === 'b' ? 'black' : 'white';
};
