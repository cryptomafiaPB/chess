// constants/pieces.ts
import { Piece } from '../types/chess';
import type { LucideIcon } from 'lucide-react';
import {
    ChessKing,
    ChessQueen,
    ChessRook,
    ChessBishop,
    ChessKnight,
    ChessPawn,
} from 'lucide-react';

type NonNullPiece = Exclude<Piece, null>;

// export const PIECE_ICONS: Record<NonNullPiece, LucideIcon> = {
//     wK: ChessKing,
//     wQ: ChessQueen,
//     wR: ChessRook,
//     wB: ChessBishop,
//     wN: ChessKnight,
//     wP: ChessPawn,
//     bK: ChessKing,
//     bQ: ChessQueen,
//     bR: ChessRook,
//     bB: ChessBishop,
//     bN: ChessKnight,
//     bP: ChessPawn,
// };

export const PIECE_IMAGES: Record<NonNullPiece, string> = {
    wQ: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/wQ.svg?raw=true',
    wK: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/wK.svg?raw=true',
    wR: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/wR.svg?raw=true',
    wB: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/wB.svg?raw=true',
    wN: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/wN.svg?raw=true',
    wP: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/wP.svg?raw=true',
    bK: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/bK.svg?raw=true',
    bQ: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/bQ.svg?raw=true',
    bR: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/bR.svg?raw=true',
    bB: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/bB.svg?raw=true',
    bN: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/bN.svg?raw=true',
    bP: 'https://github.com/lichess-org/lila/blob/master/public/piece/merida/bP.svg?raw=true',
};

// pirouetti, pixel, alpha, merida, 