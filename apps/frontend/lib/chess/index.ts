// lib/chess/index.ts
// Export all chess utilities

export { ChessEngine, createChessEngine } from './engine';
export type { ChessMove, GameResult, LegalMove } from './engine';

export { ChessBot, createBot, getBestMove, BOT_CONFIGS } from './bot';
export type { BotDifficulty, BotConfig } from './bot';

export { evaluatePosition, quickEvaluate } from './evaluation';
