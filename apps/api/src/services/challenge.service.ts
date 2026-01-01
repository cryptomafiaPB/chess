import { db } from '../config/database';
import { redis } from '../db/redis';
import { games } from '../schema/game.schema';
import { gameService } from './game.service';
import { friendService } from './friend.service';

type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical';

interface Challenge {
    challengeId: string;
    challengerId: string;
    challengedId: string;
    timeControl: TimeControl;
    createdAt: number;
    expiresAt: number;
}

export class ChallengeService {
    private challengeKey(challengeId: string) {
        return `challenge:${challengeId}`;
    }

    private userChallengesKey(userId: string) {
        return `challenges:user:${userId}`;
    }

    private generateChallengeId(): string {
        return `ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    async createChallenge(
        challengerId: string,
        challengedId: string,
        timeControl: TimeControl
    ): Promise<Challenge> {
        // Verify they are friends
        const areFriends = await friendService.areFriends(
            parseInt(challengerId),
            parseInt(challengedId)
        );

        if (!areFriends) {
            throw new Error('You can only challenge friends');
        }

        // Check if there's already a pending challenge between these users
        const existingChallenge = await this.getPendingChallengeBetween(challengerId, challengedId);
        if (existingChallenge) {
            throw new Error('There is already a pending challenge between you and this user');
        }

        const challengeId = this.generateChallengeId();
        const now = Date.now();

        const challenge: Challenge = {
            challengeId,
            challengerId,
            challengedId,
            timeControl,
            createdAt: now,
            expiresAt: now + 60_000 // 1 minute expiration
        };

        const key = this.challengeKey(challengeId);

        // Store challenge
        await redis.set(key, JSON.stringify(challenge), 'EX', 60);

        // Add to both users' challenge lists
        await redis.sadd(this.userChallengesKey(challengerId), challengeId);
        await redis.sadd(this.userChallengesKey(challengedId), challengeId);

        // Set expiry on user lists (cleanup)
        await redis.expire(this.userChallengesKey(challengerId), 120);
        await redis.expire(this.userChallengesKey(challengedId), 120);

        return challenge;
    }

    async getChallenge(challengeId: string): Promise<Challenge | null> {
        const key = this.challengeKey(challengeId);
        const data = await redis.get(key);

        if (!data) return null;

        const challenge = JSON.parse(data) as Challenge;

        // Check if expired
        if (Date.now() > challenge.expiresAt) {
            await this.deleteChallenge(challengeId);
            return null;
        }

        return challenge;
    }

    async getPendingChallengeBetween(userId1: string, userId2: string): Promise<Challenge | null> {
        const challengeIds = await redis.smembers(this.userChallengesKey(userId1));

        for (const challengeId of challengeIds) {
            const challenge = await this.getChallenge(challengeId);
            if (challenge) {
                const involves = (challenge.challengerId === userId1 && challenge.challengedId === userId2) ||
                    (challenge.challengerId === userId2 && challenge.challengedId === userId1);
                if (involves) {
                    return challenge;
                }
            }
        }

        return null;
    }

    async getUserPendingChallenges(userId: string): Promise<Challenge[]> {
        const challengeIds = await redis.smembers(this.userChallengesKey(userId));
        const challenges: Challenge[] = [];

        for (const challengeId of challengeIds) {
            const challenge = await this.getChallenge(challengeId);
            if (challenge) {
                challenges.push(challenge);
            }
        }

        return challenges;
    }

    async acceptChallenge(challengeId: string, accepterId: string): Promise<{ gameId: string }> {
        const challenge = await this.getChallenge(challengeId);

        if (!challenge) {
            throw new Error('Challenge not found or has expired');
        }

        if (challenge.challengedId !== accepterId) {
            throw new Error('You are not the challenged player');
        }

        if (Date.now() > challenge.expiresAt) {
            await this.deleteChallenge(challengeId);
            throw new Error('Challenge has expired');
        }

        // Create the game - challenger gets random color
        const isWhite = Math.random() < 0.5;
        const whiteId = isWhite ? challenge.challengerId : challenge.challengedId;
        const blackId = isWhite ? challenge.challengedId : challenge.challengerId;

        const [game] = await db.insert(games).values({
            whitePlayerId: parseInt(whiteId),
            blackPlayerId: parseInt(blackId),
            timeControl: challenge.timeControl,
            mode: 'pvp',
            status: 'active'
        }).returning();

        await gameService.createInitialState(game!.id);

        // Clean up challenge
        await this.deleteChallenge(challengeId);

        return { gameId: String(game!.id) };
    }

    async declineChallenge(challengeId: string, declinerId: string): Promise<void> {
        const challenge = await this.getChallenge(challengeId);

        if (!challenge) {
            throw new Error('Challenge not found or has expired');
        }

        if (challenge.challengedId !== declinerId) {
            throw new Error('You are not the challenged player');
        }

        await this.deleteChallenge(challengeId);
    }

    async cancelChallenge(challengeId: string, cancellerId: string): Promise<void> {
        const challenge = await this.getChallenge(challengeId);

        if (!challenge) {
            throw new Error('Challenge not found or has expired');
        }

        if (challenge.challengerId !== cancellerId) {
            throw new Error('You are not the challenger');
        }

        await this.deleteChallenge(challengeId);
    }

    private async deleteChallenge(challengeId: string): Promise<void> {
        const challenge = await this.getChallenge(challengeId);

        if (challenge) {
            await redis.srem(this.userChallengesKey(challenge.challengerId), challengeId);
            await redis.srem(this.userChallengesKey(challenge.challengedId), challengeId);
        }

        await redis.del(this.challengeKey(challengeId));
    }
}

export const challengeService = new ChallengeService();
