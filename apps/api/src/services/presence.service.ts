// backend/src/services/presence.service.ts
import { db } from '../config/database';
import { eq } from 'drizzle-orm';
import { gameService } from './game.service';
import { redis } from 'db/redis';
import { games } from 'schema/game.schema';
import { getDisconnectGraceMs } from 'utils/presence';
import type { TimeControl } from 'utils/timeControl';

type Role = 'white' | 'black';

export class PresenceService {
    private key(gameId: string) {
        return `presence:${gameId}`;
    }

    async markOnline(gameId: string, role: Role) {
        const key = this.key(gameId);
        const statusField = role === 'white' ? 'whiteStatus' : 'blackStatus';
        const timeoutField =
            role === 'white' ? 'whiteTimeoutAt' : 'blackTimeoutAt';

        await redis.hset(key, {
            [statusField]: 'online',
            [timeoutField]: '0'
        });
        await redis.expire(key, 60 * 60 * 6);
    }

    async markOffline(gameId: string, role: Role) {
        const key = this.key(gameId);

        const game = await db.query.games.findFirst({
            where: eq(games.id, Number(gameId))
        });
        if (!game) return;

        const graceMs = getDisconnectGraceMs(
            game.timeControl as TimeControl
        );
        const timeoutAt = Date.now() + graceMs;

        const statusField = role === 'white' ? 'whiteStatus' : 'blackStatus';
        const timeoutField =
            role === 'white' ? 'whiteTimeoutAt' : 'blackTimeoutAt';

        await redis.hset(key, {
            [statusField]: 'offline',
            [timeoutField]: timeoutAt.toString()
        });
        await redis.expire(key, 60 * 60 * 6);
    }

    async checkTimeout(gameId: string, io: import('socket.io').Server) {
        const key = this.key(gameId);
        const [
            whiteStatus,
            blackStatus,
            whiteTimeoutAtStr,
            blackTimeoutAtStr
        ] = await redis.hmget(
            key,
            'whiteStatus',
            'blackStatus',
            'whiteTimeoutAt',
            'blackTimeoutAt'
        );

        const now = Date.now();
        const whiteTimeoutAt = Number(whiteTimeoutAtStr || 0);
        const blackTimeoutAt = Number(blackTimeoutAtStr || 0);

        let flagRole: Role | null = null;

        if (whiteStatus === 'offline' && whiteTimeoutAt > 0 && now >= whiteTimeoutAt) {
            flagRole = 'white';
        } else if (blackStatus === 'offline' && blackTimeoutAt > 0 && now >= blackTimeoutAt) {
            flagRole = 'black';
        }

        if (!flagRole) return;

        const gameRow = await db.query.games.findFirst({
            where: eq(games.id, Number(gameId))
        });
        if (!gameRow || gameRow.status !== 'active') return;

        const userId =
            flagRole === 'white'
                ? gameRow.whitePlayerId
                : gameRow.blackPlayerId;

        const result = await gameService.resign(gameId, userId.toString());

        io.to(`game:${gameId}`).emit('game:ended', {
            gameId,
            result: result.result,
            resultReason: 'disconnect'
        });
    }
}

export const presenceService = new PresenceService();
