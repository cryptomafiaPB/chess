import { db } from '../config/database';
import { redis } from '../db/redis';
import { games } from '../schema/game.schema';
import { gameService } from './game.service';

interface RematchRequest {
    gameId: string;
    requesterId: string;
    opponentId: string;
    timeControl: string;
    expiresAt: number;
}

export class RematchService {
    private rematchKey(gameId: string) {
        return `rematch:${gameId}`;
    }

    async createRematchRequest(
        gameId: string,
        requesterId: string,
        opponentId: string
    ): Promise<RematchRequest> {
        // Get the original game details
        const originalGame = await gameService.getGameRow(gameId);

        if (originalGame.status !== 'completed') {
            throw new Error('Cannot request rematch for an active game');
        }

        const rematchData: RematchRequest = {
            gameId,
            requesterId,
            opponentId,
            timeControl: originalGame.timeControl,
            expiresAt: Date.now() + 120_000 // 2 minutes
        };

        const key = this.rematchKey(gameId);
        await redis.set(key, JSON.stringify(rematchData), 'EX', 120); // expires in 120 seconds

        return rematchData;
    }

    async getRematchRequest(gameId: string): Promise<RematchRequest | null> {
        const key = this.rematchKey(gameId);
        const data = await redis.get(key);

        if (!data) return null;

        const rematch = JSON.parse(data) as RematchRequest;

        // Check if expired
        if (Date.now() > rematch.expiresAt) {
            await redis.del(key);
            return null;
        }

        return rematch;
    }

    async acceptRematch(gameId: string, accepterId: string): Promise<{ newGameId: string }> {
        const rematchRequest = await this.getRematchRequest(gameId);

        if (!rematchRequest) {
            throw new Error('No active rematch request found');
        }

        if (rematchRequest.opponentId !== accepterId) {
            throw new Error('You are not the opponent in this rematch request');
        }

        if (Date.now() > rematchRequest.expiresAt) {
            throw new Error('Rematch request has expired');
        }

        // Get original game to swap colors
        const originalGame = await gameService.getGameRow(gameId);

        // Swap colors for the rematch
        const newWhite = originalGame.blackPlayerId;
        const newBlack = originalGame.whitePlayerId;

        // Create new game
        const [newGame] = await db.insert(games).values({
            whitePlayerId: newWhite,
            blackPlayerId: newBlack,
            timeControl: rematchRequest.timeControl as any,
            mode: 'pvp',
            status: 'active'
        }).returning();

        // Initialize game state in Redis
        await gameService.createInitialState(newGame!.id);

        // Clean up rematch request
        await redis.del(this.rematchKey(gameId));

        return { newGameId: newGame!.id.toString() };
    }

    async declineRematch(gameId: string, declinerId: string): Promise<void> {
        const rematchRequest = await this.getRematchRequest(gameId);

        if (!rematchRequest) {
            throw new Error('No active rematch request found');
        }

        if (rematchRequest.opponentId !== declinerId) {
            throw new Error('You are not the opponent in this rematch request');
        }

        // Clean up rematch request
        await redis.del(this.rematchKey(gameId));
    }

    async cancelRematchRequest(gameId: string, requesterId: string): Promise<void> {
        const rematchRequest = await this.getRematchRequest(gameId);

        if (!rematchRequest) {
            throw new Error('No active rematch request found');
        }

        if (rematchRequest.requesterId !== requesterId) {
            throw new Error('You did not create this rematch request');
        }

        // Clean up rematch request
        await redis.del(this.rematchKey(gameId));
    }

    async checkRematchExpired(gameId: string): Promise<boolean> {
        const rematchRequest = await this.getRematchRequest(gameId);
        return !rematchRequest; // null means expired or doesn't exist
    }
}

export const rematchService = new RematchService();
