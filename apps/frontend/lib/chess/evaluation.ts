// lib/chess/evaluation.ts
// Position evaluation for the chess bot

import type { ChessEngine } from './engine';

// Piece values (centipawns)
const PIECE_VALUES: Record<string, number> = {
    p: 100,   // Pawn
    n: 320,   // Knight
    b: 330,   // Bishop
    r: 500,   // Rook
    q: 900,   // Queen
    k: 20000, // King (high value to prioritize king safety)
};

// Piece-square tables for positional evaluation
// Values are from white's perspective, flipped for black

const PAWN_TABLE = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE = [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE = [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE = [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_MIDDLE_TABLE = [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
];

const KING_END_TABLE = [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50],
];

const PIECE_TABLES: Record<string, number[][]> = {
    p: PAWN_TABLE,
    n: KNIGHT_TABLE,
    b: BISHOP_TABLE,
    r: ROOK_TABLE,
    q: QUEEN_TABLE,
    k: KING_MIDDLE_TABLE,
};

/**
 * Get piece-square value
 */
function getPieceSquareValue(
    piece: string,
    row: number,
    col: number,
    isWhite: boolean,
    isEndgame: boolean
): number {
    const table = piece === 'k' && isEndgame ? KING_END_TABLE : PIECE_TABLES[piece];
    if (!table) return 0;

    // Flip row for black pieces
    const actualRow = isWhite ? row : 7 - row;
    return table[actualRow][col];
}

/**
 * Check if position is in endgame
 */
function isEndgame(engine: ChessEngine): boolean {
    const board = engine.getBoard();
    let queens = 0;
    let minorPieces = 0;

    for (const row of board) {
        for (const piece of row) {
            if (piece) {
                if (piece.type === 'q') queens++;
                if (piece.type === 'n' || piece.type === 'b') minorPieces++;
            }
        }
    }

    // Endgame if no queens or both sides have at most 1 minor piece with queen
    return queens === 0 || (queens <= 2 && minorPieces <= 2);
}

/**
 * Evaluate material balance
 */
function evaluateMaterial(engine: ChessEngine): number {
    const board = engine.getBoard();
    let score = 0;

    for (const row of board) {
        for (const piece of row) {
            if (piece) {
                const value = PIECE_VALUES[piece.type] || 0;
                score += piece.color === 'w' ? value : -value;
            }
        }
    }

    return score;
}

/**
 * Evaluate piece positions
 */
function evaluatePositions(engine: ChessEngine): number {
    const board = engine.getBoard();
    const endgame = isEndgame(engine);
    let score = 0;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const isWhite = piece.color === 'w';
                const posValue = getPieceSquareValue(piece.type, row, col, isWhite, endgame);
                score += isWhite ? posValue : -posValue;
            }
        }
    }

    return score;
}

/**
 * Evaluate mobility (number of legal moves)
 */
function evaluateMobility(engine: ChessEngine): number {
    const currentTurn = engine.getTurn();
    const currentMoves = engine.getLegalMoves().length;

    // Simple mobility bonus
    return currentTurn === 'white' ? currentMoves * 2 : -currentMoves * 2;
}

/**
 * Evaluate pawn structure
 */
function evaluatePawnStructure(engine: ChessEngine): number {
    const board = engine.getBoard();
    let score = 0;

    // Track pawns by file
    const whitePawnsPerFile: number[] = Array(8).fill(0);
    const blackPawnsPerFile: number[] = Array(8).fill(0);

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece?.type === 'p') {
                if (piece.color === 'w') {
                    whitePawnsPerFile[col]++;
                } else {
                    blackPawnsPerFile[col]++;
                }
            }
        }
    }

    // Penalize doubled pawns
    for (let col = 0; col < 8; col++) {
        if (whitePawnsPerFile[col] > 1) {
            score -= 20 * (whitePawnsPerFile[col] - 1);
        }
        if (blackPawnsPerFile[col] > 1) {
            score += 20 * (blackPawnsPerFile[col] - 1);
        }
    }

    // Penalize isolated pawns
    for (let col = 0; col < 8; col++) {
        const leftFile = col > 0 ? whitePawnsPerFile[col - 1] : 0;
        const rightFile = col < 7 ? whitePawnsPerFile[col + 1] : 0;
        if (whitePawnsPerFile[col] > 0 && leftFile === 0 && rightFile === 0) {
            score -= 15;
        }

        const leftFileB = col > 0 ? blackPawnsPerFile[col - 1] : 0;
        const rightFileB = col < 7 ? blackPawnsPerFile[col + 1] : 0;
        if (blackPawnsPerFile[col] > 0 && leftFileB === 0 && rightFileB === 0) {
            score += 15;
        }
    }

    return score;
}

/**
 * Evaluate king safety
 */
function evaluateKingSafety(engine: ChessEngine): number {
    let score = 0;
    const board = engine.getBoard();

    // Find kings
    let whiteKingPos: { row: number; col: number } | null = null;
    let blackKingPos: { row: number; col: number } | null = null;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece?.type === 'k') {
                if (piece.color === 'w') {
                    whiteKingPos = { row, col };
                } else {
                    blackKingPos = { row, col };
                }
            }
        }
    }

    // Bonus for pawns in front of king (shield)
    if (whiteKingPos) {
        for (let dc = -1; dc <= 1; dc++) {
            const col = whiteKingPos.col + dc;
            if (col >= 0 && col < 8) {
                for (let dr = -1; dr >= -2; dr--) {
                    const row = whiteKingPos.row + dr;
                    if (row >= 0 && row < 8) {
                        const piece = board[row][col];
                        if (piece?.type === 'p' && piece.color === 'w') {
                            score += 10;
                        }
                    }
                }
            }
        }
    }

    if (blackKingPos) {
        for (let dc = -1; dc <= 1; dc++) {
            const col = blackKingPos.col + dc;
            if (col >= 0 && col < 8) {
                for (let dr = 1; dr <= 2; dr++) {
                    const row = blackKingPos.row + dr;
                    if (row >= 0 && row < 8) {
                        const piece = board[row][col];
                        if (piece?.type === 'p' && piece.color === 'b') {
                            score -= 10;
                        }
                    }
                }
            }
        }
    }

    return score;
}

/**
 * Main evaluation function
 * Returns score in centipawns from white's perspective
 * Positive = white is better, Negative = black is better
 */
export function evaluatePosition(engine: ChessEngine): number {
    // Check for game over states
    const result = engine.getGameResult();
    if (result.isOver) {
        if (result.winner === 'white') return 100000;
        if (result.winner === 'black') return -100000;
        return 0; // Draw
    }

    let score = 0;

    // Material (most important)
    score += evaluateMaterial(engine);

    // Piece positions
    score += evaluatePositions(engine);

    // Mobility
    score += evaluateMobility(engine);

    // Pawn structure
    score += evaluatePawnStructure(engine);

    // King safety
    score += evaluateKingSafety(engine);

    // Check bonus
    if (engine.isCheck()) {
        score += engine.getTurn() === 'white' ? -30 : 30;
    }

    return score;
}

/**
 * Quick material-only evaluation (faster for move ordering)
 */
export function quickEvaluate(engine: ChessEngine): number {
    return evaluateMaterial(engine) + evaluatePositions(engine);
}
