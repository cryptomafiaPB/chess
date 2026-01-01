// lib/chess/bot.ts
// Chess bot AI with configurable difficulty levels

import { ChessEngine, type ChessMove, type LegalMove } from './engine';
import { evaluatePosition, quickEvaluate } from './evaluation';

export type BotDifficulty = 1 | 2 | 3 | 4 | 5;

export interface BotConfig {
    difficulty: BotDifficulty;
    name: string;
    description: string;
    thinkingTime: number; // Minimum "thinking" time in ms for UX
}

export const BOT_CONFIGS: Record<BotDifficulty, BotConfig> = {
    1: {
        difficulty: 1,
        name: 'Beginner',
        description: 'Perfect for learning the basics',
        thinkingTime: 150,
    },
    2: {
        difficulty: 2,
        name: 'Easy',
        description: 'Plays simple but logical moves',
        thinkingTime: 200,
    },
    3: {
        difficulty: 3,
        name: 'Medium',
        description: 'A challenging opponent for casual players',
        thinkingTime: 300,
    },
    4: {
        difficulty: 4,
        name: 'Hard',
        description: 'Strong tactical play, hard to beat',
        thinkingTime: 400,
    },
    5: {
        difficulty: 5,
        name: 'Expert',
        description: 'Master-level analysis, very difficult',
        thinkingTime: 500,
    },
};

// Depth settings per difficulty
const SEARCH_DEPTH: Record<BotDifficulty, number> = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
};

// Randomness factor (higher = more random/weaker)
const RANDOMNESS: Record<BotDifficulty, number> = {
    1: 200, // Very random
    2: 100,
    3: 50,
    4: 20,
    5: 5,   // Almost no randomness
};

interface ScoredMove {
    move: LegalMove;
    score: number;
}

/**
 * Order moves for better alpha-beta pruning
 */
function orderMoves(engine: ChessEngine, moves: LegalMove[]): LegalMove[] {
    const scored: ScoredMove[] = moves.map((move) => {
        let score = 0;

        // Prioritize captures (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
        if (move.flags.includes('c') || move.flags.includes('e')) {
            const victimValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
            const attackerValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

            // Get captured piece by making the move temporarily
            const cloned = engine.clone();
            const result = cloned.makeMove({ from: move.from, to: move.to, promotion: move.promotion });
            if (result?.captured) {
                score += 10 * (victimValues[result.captured] || 0) - (attackerValues[move.piece] || 0);
            } else {
                score += 5; // En passant or unknown capture
            }
        }

        // Prioritize promotions
        if (move.flags.includes('p')) {
            const promoValues: Record<string, number> = { q: 9, r: 5, b: 3, n: 3 };
            score += promoValues[move.promotion || 'q'] || 0;
        }

        // Prioritize checks (requires making the move)
        const cloned = engine.clone();
        cloned.makeMove({ from: move.from, to: move.to, promotion: move.promotion });
        if (cloned.isCheck()) {
            score += 3;
        }

        return { move, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.move);
}

/**
 * Minimax with alpha-beta pruning
 */
function minimax(
    engine: ChessEngine,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    difficulty: BotDifficulty
): number {
    // Terminal conditions
    if (depth === 0 || engine.isGameOver()) {
        return evaluatePosition(engine);
    }

    const moves = engine.getLegalMoves();

    // Order moves for better pruning (only at higher depths)
    const orderedMoves = depth >= 2 ? orderMoves(engine, moves) : moves;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of orderedMoves) {
            const cloned = engine.clone();
            cloned.makeMove({ from: move.from, to: move.to, promotion: move.promotion });
            const evalScore = minimax(cloned, depth - 1, alpha, beta, false, difficulty);
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break; // Beta cutoff
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of orderedMoves) {
            const cloned = engine.clone();
            cloned.makeMove({ from: move.from, to: move.to, promotion: move.promotion });
            const evalScore = minimax(cloned, depth - 1, alpha, beta, true, difficulty);
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break; // Alpha cutoff
        }
        return minEval;
    }
}

/**
 * Get the best move for the current position
 */
export function getBestMove(engine: ChessEngine, difficulty: BotDifficulty): LegalMove | null {
    const moves = engine.getLegalMoves();
    if (moves.length === 0) return null;

    const depth = SEARCH_DEPTH[difficulty];
    const randomness = RANDOMNESS[difficulty];
    const isWhite = engine.getTurn() === 'white';

    // Score all moves
    const scoredMoves: ScoredMove[] = [];

    for (const move of moves) {
        const cloned = engine.clone();
        cloned.makeMove({ from: move.from, to: move.to, promotion: move.promotion });

        // Minimax evaluation
        const score = minimax(cloned, depth - 1, -Infinity, Infinity, !isWhite, difficulty);

        // Add randomness based on difficulty
        const randomFactor = (Math.random() - 0.5) * randomness;

        scoredMoves.push({
            move,
            score: score + randomFactor,
        });
    }

    // Sort by score (best first for the bot's color)
    if (isWhite) {
        scoredMoves.sort((a, b) => b.score - a.score);
    } else {
        scoredMoves.sort((a, b) => a.score - b.score);
    }

    // For beginner difficulty, sometimes pick from top 3-5 moves randomly
    if (difficulty === 1 && scoredMoves.length > 1) {
        const topMoves = scoredMoves.slice(0, Math.min(5, scoredMoves.length));
        return topMoves[Math.floor(Math.random() * topMoves.length)].move;
    }

    // For easy difficulty, sometimes pick from top 2-3 moves
    if (difficulty === 2 && scoredMoves.length > 1) {
        const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
        return topMoves[Math.floor(Math.random() * topMoves.length)].move;
    }

    return scoredMoves[0]?.move || null;
}

/**
 * Chess Bot class for managing bot state and moves
 */
export class ChessBot {
    private difficulty: BotDifficulty;
    private config: BotConfig;

    constructor(difficulty: BotDifficulty = 3) {
        this.difficulty = difficulty;
        this.config = BOT_CONFIGS[difficulty];
    }

    getDifficulty(): BotDifficulty {
        return this.difficulty;
    }

    getConfig(): BotConfig {
        return this.config;
    }

    setDifficulty(difficulty: BotDifficulty): void {
        this.difficulty = difficulty;
        this.config = BOT_CONFIGS[difficulty];
    }

    /**
     * Get bot's next move with artificial thinking delay
     */
    async getMove(engine: ChessEngine): Promise<ChessMove | null> {
        const startTime = Date.now();

        // Calculate the best move
        const bestMove = getBestMove(engine, this.difficulty);

        if (!bestMove) return null;

        // Add artificial thinking time for UX
        const elapsed = Date.now() - startTime;
        const remainingDelay = Math.max(0, this.config.thinkingTime - elapsed);

        if (remainingDelay > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingDelay));
        }

        return {
            from: bestMove.from,
            to: bestMove.to,
            promotion: bestMove.promotion,
            san: bestMove.san,
        };
    }

    /**
     * Get bot's move synchronously (for immediate response)
     */
    getMoveSync(engine: ChessEngine): ChessMove | null {
        const bestMove = getBestMove(engine, this.difficulty);
        if (!bestMove) return null;

        return {
            from: bestMove.from,
            to: bestMove.to,
            promotion: bestMove.promotion,
            san: bestMove.san,
        };
    }
}

/**
 * Create a new bot instance
 */
export function createBot(difficulty: BotDifficulty = 3): ChessBot {
    return new ChessBot(difficulty);
}
