import { db } from '../config/database';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { redis } from 'db/redis';
import { games } from 'schema/game.schema';
import { ratings } from 'schema/ratings.schema';

type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical';

interface QueuePlayer {
    userId: string;
    rating: number;
    timeControl: TimeControl;
}

const QUEUE_KEY = (tc: TimeControl) => `mm:queue:${tc}`;

export class MatchmakingService {
    // Add player to queue
    async enqueue(player: QueuePlayer) {
        const key = QUEUE_KEY(player.timeControl);
        // Use timestamp for FIFO + allow future rating-based improvements
        const score = Date.now();
        await redis.zadd(key, score, JSON.stringify(player));
    }

    // Remove player from queue
    async dequeue(userId: string, timeControl: TimeControl) {
        const key = QUEUE_KEY(timeControl);
        const members = await redis.zrange(key, 0, -1);
        for (const member of members) {
            const p = JSON.parse(member) as QueuePlayer;
            if (p.userId === userId) {
                await redis.zrem(key, member);
                break;
            }
        }
    }

    // Try to find a match immediately
    async findMatch(timeControl: TimeControl): Promise<{
        gameId: string;
        whitePlayerId: string;
        blackPlayerId: string;
    } | null> {
        const key = QUEUE_KEY(timeControl);
        const members = (await redis.zrange(key, 0, -1)) ?? []

        if (members.length < 2) return null;

        // Take first two for V1 (simple FIFO). Rating-based pairing can be added later.
        const p1 = JSON.parse(members[0]!) as QueuePlayer;
        const p2 = JSON.parse(members[1]!) as QueuePlayer;

        // Remove from queue
        await redis.zrem(key, members[0]!, members[1]!);

        // Decide colors randomly
        const white = Math.random() < 0.5 ? p1.userId : p2.userId;
        const black = white === p1.userId ? p2.userId : p1.userId;

        const [game] = await db.insert(games).values({
            id: randomUUID(),
            whitePlayerId: white,
            blackPlayerId: black,
            timeControl,
            mode: 'pvp',
            status: 'active'
        }).returning();

        return {
            gameId: game!.id,
            whitePlayerId: white,
            blackPlayerId: black
        };
    }

    // Helper to load rating for queueing
    async getPlayerRating(userId: string, timeControl: TimeControl) {
        const r = await db.query.ratings.findFirst({
            where: eq(ratings.userId, parseInt(userId))
        });
        return r?.rating ?? 1200;
    }
}

export const matchmakingService = new MatchmakingService();
