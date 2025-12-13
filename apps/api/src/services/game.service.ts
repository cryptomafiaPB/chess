import { Chess } from 'chess.js';
import { db } from '../config/database';
import { eq } from 'drizzle-orm';
import { redis } from 'db/redis';
import { games } from 'schema/game.schema';

interface MakeMoveInput {
    gameId: string;
    userId: string;
    from: string;
    to: string;
    promotion?: 'q' | 'r' | 'b' | 'n';
}

export type GameResult = 'white_wins' | 'black_wins' | 'draw';

export class GameService {
    private gameKey(gameId: string) {
        return `game:${gameId}`;
    }

    async createInitialState(gameId: string) {
        const chess = new Chess();
        const key = this.gameKey(gameId);

        await redis.hset(key, {
            fen: chess.fen(),
            status: 'active'
        });

        // Optionally set TTL until cleanup
        await redis.expire(key, 60 * 60 * 6); // 6 hours
    }

    async getGame(gameId: string) {
        const game = await db.query.games.findFirst({
            where: eq(games.id, gameId)
        });
        if (!game) throw new Error('Game not found');
        return game;
    }

    async loadChess(gameId: string): Promise<Chess> {
        const key = this.gameKey(gameId);
        const fen = await redis.hget(key, 'fen');
        const chess = new Chess();
        if (fen) chess.load(fen);
        return chess;
    }

    async saveChess(gameId: string, chess: Chess) {
        const key = this.gameKey(gameId);
        await redis.hset(key, { fen: chess.fen() });
    }

    async makeMove(input: MakeMoveInput) {
        const game = await this.getGame(input.gameId);

        // Authorize player
        const isWhite = input.userId === game.whitePlayerId;
        const isBlack = input.userId === game.blackPlayerId;
        if (!isWhite && !isBlack) {
            throw new Error('Not a player in this game');
        }

        const chess = await this.loadChess(input.gameId);

        // Check turn
        const turn = chess.turn(); // 'w' | 'b'
        if ((turn === 'w' && !isWhite) || (turn === 'b' && !isBlack)) {
            throw new Error('Not your turn');
        }

        // Try move
        const move = chess.move({
            from: input.from,
            to: input.to,
            promotion: input.promotion ?? 'q'
        });

        if (!move) {
            throw new Error('Illegal move');
        }

        // Persist new state
        await this.saveChess(input.gameId, chess);

        const key = this.gameKey(input.gameId);
        const isCheckmate = chess.isCheckmate();
        const isDraw =
            chess.isDraw() ||
            chess.isStalemate() ||
            chess.isThreefoldRepetition() ||
            chess.isInsufficientMaterial();

        let result: GameResult | null = null;
        let resultReason: string | null = null;

        if (isCheckmate) {
            result = turn === 'w' ? 'white_wins' : 'black_wins';
            resultReason = 'checkmate';
        } else if (isDraw) {
            result = 'draw';
            resultReason = 'draw';
        }

        if (result) {
            // Complete game
            await db
                .update(games)
                .set({
                    status: 'completed',
                    result,
                    resultReason,
                    endedAt: new Date()
                })
                .where(eq(games.id, input.gameId));

            await redis.hset(key, {
                status: 'completed',
                result,
                resultReason
            });

            // TODO: update ratings in ratingService (next iteration)
        }

        return {
            move,
            fen: chess.fen(),
            gameOver: !!result,
            result,
            resultReason
        };
    }

    async resign(gameId: string, userId: string) {
        const game = await this.getGame(gameId);
        let result: GameResult;
        if (userId === game.whitePlayerId) result = 'black_wins';
        else if (userId === game.blackPlayerId) result = 'white_wins';
        else throw new Error('Not a player in this game');

        await db.update(games).set({
            status: 'completed',
            result,
            resultReason: 'resign',
            endedAt: new Date()
        }).where(eq(games.id, gameId));

        await redis.hset(this.gameKey(gameId), {
            status: 'completed',
            result,
            resultReason: 'resign'
        });

        return { result, resultReason: 'resign' };
    }
}

export const gameService = new GameService();
