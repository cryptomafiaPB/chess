import { redis } from "db/redis";


const EXPIRY_SECONDS = 3600 * 24;

export class GameRepository {

    async createGame(gameId: string, initialFen: string, whitePlayerId: string): Promise<void> {
        const key = `game:${gameId}`;

        await redis.hset(key, {
            whitePlayerId,
            blackPlayerId: "",
            fen: initialFen,
            status: "waiting",
            createdAt: Date.now()
        });

        await redis.expire(key, EXPIRY_SECONDS);
    }

    async getGame(gameId: string): Promise<Record<string, string> | null> {
        const game = await redis.hgetall(`game:${gameId}`);
        if (!Object.keys(game).length) return null;
        return game;
    }

    async addBlackPlayer(gameId: string, playerId: string): Promise<void> {
        await redis.hset(`game:${gameId}`, {
            blackPlayerId: playerId,
            status: "active"
        });
    }

    async updateGameState(gameId: string, fen: string): Promise<void> {
        await redis.hset(`game:${gameId}`, { fen });
        await redis.expire(`game:${gameId}`, EXPIRY_SECONDS); // Refresh expiry on move
    }

    async addMoveToHistory(gameId: string, move: any): Promise<void> {
        await redis.rpush(`moves:${gameId}`, JSON.stringify(move));
        await redis.expire(`moves:${gameId}`, EXPIRY_SECONDS);
    }

    async getMoveHistory(gameId: string): Promise<any[]> {
        const moves = await redis.lrange(`moves:${gameId}`, 0, -1);
        return moves.map(m => JSON.parse(m));
    }
}

export const gameRepository = new GameRepository();