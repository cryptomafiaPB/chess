// utils/chessHelpers.ts
import type { Chess, Move } from 'chess.js';
import { Board, Piece, PieceType, Position } from '@/types/chess';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export const indexToSquare = (pos: Position): string => {
    const file = FILES[pos.col];
    const rank = RANKS[pos.row];
    return `${file}${rank}`;
};

export const gameToBoard = (game: Chess): Board => {
    const rawBoard = game.board(); // chess.js 2D array of squares [web:33]
    return rawBoard.map(row =>
        row.map(square => {
            if (!square) return null;
            const color = square.color === 'w' ? 'w' : 'b';
            const type = square.type.toUpperCase() as PieceType;
            return `${color}${type}` as Piece;
        })
    );
};


export const getSquareColor = (row: number, col: number): string =>
    (row + col) % 2 === 0 ? 'bg-[#F0D9B5]' : 'bg-[#B58863]';

export const getSquareColorWithSan = (san: string): string => {
    const file = san.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = 8 - parseInt(san[1], 10);
    return getSquareColor(rank, file);
}

export function safeMove(game: Chess, move: Move | string): Move | null {
    try {
        return game.move(move) ?? null;
    } catch {
        return null;
    }
}