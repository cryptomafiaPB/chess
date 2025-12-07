import { redisClient } from "../db/redis";

const EXPIRY_SECONDS = 3600 * 24; // Games expire after 24 hours of inactivity

export class GameRepository {

    async createGame(gameId: string, initialFen: string, whitePlayerId: string): Promise<void> {
        const key = `game:${gameId}`;

        await redisClient.hset(key, {
            whitePlayerId,
            blackPlayerId: "", // Empty initially
            fen: initialFen,
            status: "waiting",
            createdAt: Date.now()
        });

        // Set expiry so Redis doesn't fill up with abandoned games forever
        await redisClient.expire(key, EXPIRY_SECONDS);
    }

    async getGame(gameId: string): Promise<Record<string, string> | null> {
        const game = await redisClient.hgetall(`game:${gameId}`);
        if (!Object.keys(game).length) return null;
        return game;
    }

    async addBlackPlayer(gameId: string, playerId: string): Promise<void> {
        await redisClient.hset(`game:${gameId}`, {
            blackPlayerId: playerId,
            status: "active"
        });
    }

    async updateGameState(gameId: string, fen: string): Promise<void> {
        await redisClient.hset(`game:${gameId}`, { fen });
        await redisClient.expire(`game:${gameId}`, EXPIRY_SECONDS); // Refresh expiry on move
    }

    async addMoveToHistory(gameId: string, move: any): Promise<void> {
        await redisClient.rpush(`moves:${gameId}`, JSON.stringify(move));
        await redisClient.expire(`moves:${gameId}`, EXPIRY_SECONDS);
    }

    async getMoveHistory(gameId: string): Promise<any[]> {
        const moves = await redisClient.lrange(`moves:${gameId}`, 0, -1);
        return moves.map(m => JSON.parse(m));
    }
}

export const gameRepository = new GameRepository();