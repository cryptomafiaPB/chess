import { eq, and, or, desc, sql, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { redis } from 'db/redis';
import { users } from 'schema/user.schema';
import { profiles } from 'schema/profile.shema';
import { profileStats } from 'schema/profile-stats.schema';
import { ratings } from 'schema/ratings.schema';
import { games } from 'schema/game.schema';

export class ProfileService {
    private getEmptyStats() {
        return {
            totalGames: 0,
            totalWins: 0,
            totalLosses: 0,
            totalDraws: 0,
            longestWinStreak: 0,
            currentWinStreak: 0
        };
    }

    private async calculateStatsFromGames(userId: number) {
        const completedGames = await db
            .select({
                whitePlayerId: games.whitePlayerId,
                blackPlayerId: games.blackPlayerId,
                result: games.result,
                endedAt: games.endedAt
            })
            .from(games)
            .where(and(
                or(
                    eq(games.whitePlayerId, userId),
                    eq(games.blackPlayerId, userId)
                ),
                eq(games.status, 'completed')
            ))
            .orderBy(asc(games.endedAt));

        if (!completedGames.length) {
            return this.getEmptyStats();
        }

        const stats = this.getEmptyStats();

        for (const game of completedGames) {
            if (!game.result) continue;

            stats.totalGames += 1;

            const isWhite = game.whitePlayerId === userId;
            let outcome: 'win' | 'loss' | 'draw';

            if (game.result === 'draw') {
                outcome = 'draw';
            } else if (
                (isWhite && game.result === 'white_wins') ||
                (!isWhite && game.result === 'black_wins')
            ) {
                outcome = 'win';
            } else {
                outcome = 'loss';
            }

            if (outcome === 'win') {
                stats.totalWins += 1;
                stats.currentWinStreak += 1;
                if (stats.currentWinStreak > stats.longestWinStreak) {
                    stats.longestWinStreak = stats.currentWinStreak;
                }
            } else {
                if (outcome === 'loss') {
                    stats.totalLosses += 1;
                } else if (outcome === 'draw') {
                    stats.totalDraws += 1;
                }
                stats.currentWinStreak = 0;
            }
        }

        return stats;
    }

    private async getAggregatedStats(userId: number) {
        const existingStats = await db.query.profileStats.findFirst({
            where: eq(profileStats.userId, userId)
        });

        if (existingStats && existingStats.totalGames > 0) {
            return {
                totalGames: existingStats.totalGames,
                totalWins: existingStats.totalWins,
                totalLosses: existingStats.totalLosses,
                totalDraws: existingStats.totalDraws,
                longestWinStreak: existingStats.longestWinStreak,
                currentWinStreak: existingStats.currentWinStreak
            };
        }

        return this.calculateStatsFromGames(userId);
    }

    // Get user profile by ID 
    async getProfile(userId: string, requesterId?: string) {
        // Try cache first
        const cacheKey = `profile:${userId}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        // Fetch from database
        const user = await db.query.users.findFirst({
            where: eq(users.id, Number(userId)),
            columns: {
                id: true,
                email: requesterId === userId, // Only show email to self
                username: true,
                avatar_url: true,
                createdAt: true
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Get profile details
        const profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, Number(userId))
        });

        // Get ratings
        const userRatings = await db.query.ratings.findMany({
            where: eq(ratings.userId, Number(userId))
        });

        const profileData = {
            ...user,
            profile: profile || {},
            ratings: userRatings,
            stats: await this.getAggregatedStats(Number(userId))
        };

        // Cache for 30 minutes
        await redis.setex(cacheKey, 1800, JSON.stringify(profileData));

        return profileData;
    }

    // Update user profile 
    async updateProfile(userId: string, data: {
        username?: string;
        avatar?: string;
        bio?: string;
        country?: string;
        preferences?: {
            voiceEnabled?: boolean;
            soundEnabled?: boolean;
        };
    }) {
        // Update user table if username or avatar changed
        if (data.username || data.avatar) {
            await db
                .update(users)
                .set({
                    ...(data.username && { username: data.username }),
                    ...(data.avatar && { avatar: data.avatar }),
                    updatedAt: new Date()
                })
                .where(eq(users.id, Number(userId)));
        }

        // Update profile table
        const profileData: any = {};
        if (data.bio !== undefined) profileData.bio = data.bio;
        if (data.country !== undefined) profileData.country = data.country;
        if (data.preferences !== undefined) {
            const existingProfile = await db.query.profiles.findFirst({
                where: eq(profiles.userId, Number(userId))
            });
            profileData.preferences = {
                ...existingProfile?.preferences,
                ...data.preferences
            };
        }

        if (Object.keys(profileData).length > 0) {
            await db
                .update(profiles)
                .set(profileData)
                .where(eq(profiles.userId, Number(userId)));
        }

        // Invalidate cache
        await redis.del(`profile:${userId}`);

        return this.getProfile(userId, userId);
    }

    // Get user stats
    async getStats(userId: string) {
        const userRatings = await db.query.ratings.findMany({
            where: eq(ratings.userId, Number(userId))
        });

        return {
            stats: await this.getAggregatedStats(Number(userId)),
            ratings: userRatings
        };
    }

    // Search users by username [web:45]
    async searchUsers(query: string, limit: number = 10) {
        const results = await db
            .select({
                id: users.id,
                username: users.username,
                avatar: users.avatar_url,
                isOnline: profiles.isOnline
            })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .where(sql`${users.username} ILIKE ${`%${query}%`}`)
            .limit(limit);

        return results;
    }

    // Get leaderboard
    async getLeaderboard(timeControl: string, limit: number = 50) {
        const cacheKey = `leaderboard:${timeControl}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        const leaderboard = await db
            .select({
                userId: ratings.userId,
                username: users.username,
                avatar: users.avatar_url,
                rating: ratings.rating,
                gamesPlayed: ratings.gamesPlayed,
                wins: ratings.wins,
                losses: ratings.losses,
                draws: ratings.draws
            })
            .from(ratings)
            .innerJoin(users, eq(ratings.userId, users.id))
            .where(and(
                eq(ratings.timeControl, timeControl),
                sql`${ratings.gamesPlayed} >= 1` // Minimum games to appear
            ))
            .orderBy(desc(ratings.rating))
            .limit(limit);

        // Cache for 10 minutes
        await redis.setex(cacheKey, 600, JSON.stringify(leaderboard));

        return leaderboard;
    }

    // Get dashboard data for current user
    async getDashboard(userId: string) {
        // Get user info
        const user = await db.query.users.findFirst({
            where: eq(users.id, Number(userId)),
            columns: {
                id: true,
                username: true,
                email: true,
                avatar_url: true,
                createdAt: true
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Get ratings for all time controls
        const userRatings = await db.query.ratings.findMany({
            where: eq(ratings.userId, Number(userId))
        });

        // Format ratings as object
        const ratingsMap: Record<string, { rating: number; gamesPlayed: number; wins: number; losses: number; draws: number }> = {};
        userRatings.forEach(r => {
            ratingsMap[r.timeControl] = {
                rating: r.rating,
                gamesPlayed: r.gamesPlayed,
                wins: r.wins,
                losses: r.losses,
                draws: r.draws
            };
        });

        // Get overall stats (fallback to games table if profile_stats is empty)
        const stats = await this.getAggregatedStats(Number(userId));

        const totalGames = stats.totalGames || 0;
        const totalWins = stats.totalWins || 0;
        const totalLosses = stats.totalLosses || 0;
        const totalDraws = stats.totalDraws || 0;
        const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0';

        // Get recent games (last 10)
        const recentGamesData = await db
            .select({
                id: games.id,
                whitePlayerId: games.whitePlayerId,
                blackPlayerId: games.blackPlayerId,
                result: games.result,
                resultReason: games.resultReason,
                timeControl: games.timeControl,
                endedAt: games.endedAt,
                whiteUsername: users.username,
            })
            .from(games)
            .leftJoin(users, or(
                eq(games.whitePlayerId, users.id),
                eq(games.blackPlayerId, users.id)
            ))
            .where(and(
                or(
                    eq(games.whitePlayerId, Number(userId)),
                    eq(games.blackPlayerId, Number(userId))
                ),
                eq(games.status, 'completed')
            ))
            .orderBy(desc(games.endedAt))
            .limit(10);

        // Get opponent usernames for recent games
        const recentGames = await Promise.all(
            recentGamesData.map(async (game) => {
                const isWhite = game.whitePlayerId === Number(userId);
                const opponentId = isWhite ? game.blackPlayerId : game.whitePlayerId;

                const opponent = await db.query.users.findFirst({
                    where: eq(users.id, opponentId),
                    columns: { username: true }
                });

                // Determine result from user's perspective
                let userResult: 'win' | 'loss' | 'draw';
                if (game.result === 'draw') {
                    userResult = 'draw';
                } else if (
                    (isWhite && game.result === 'white_wins') ||
                    (!isWhite && game.result === 'black_wins')
                ) {
                    userResult = 'win';
                } else {
                    userResult = 'loss';
                }

                return {
                    gameId: game.id.toString(),
                    opponentName: opponent?.username || 'Unknown',
                    result: userResult,
                    timeControl: game.timeControl,
                    endedAt: game.endedAt
                };
            })
        );

        return {
            me: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatar_url,
                createdAt: user.createdAt
            },
            ratings: {
                bullet: ratingsMap['bullet'] || { rating: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
                blitz: ratingsMap['blitz'] || { rating: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
                rapid: ratingsMap['rapid'] || { rating: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 },
                classical: ratingsMap['classical'] || { rating: 1200, gamesPlayed: 0, wins: 0, losses: 0, draws: 0 }
            },
            summary: {
                totalGames,
                wins: totalWins,
                losses: totalLosses,
                draws: totalDraws,
                winRate: parseFloat(winRate)
            },
            recentGames
        };
    }
}

export const profileService = new ProfileService();
