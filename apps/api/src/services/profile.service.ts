import { eq, and, or, desc, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { redis } from 'db/redis';
import { users } from 'schema/user.schema';
import { profiles } from 'schema/profile.shema';
import { profileStats } from 'schema/profile-stats.schema';
import { ratings } from 'schema/ratings.schema';

export class ProfileService {
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

        // Get stats
        const stats = await db.query.profileStats.findFirst({
            where: eq(profileStats.userId, Number(userId))
        });

        const profileData = {
            ...user,
            profile: profile || {},
            ratings: userRatings,
            stats: stats || {
                totalGames: 0,
                totalWins: 0,
                totalLosses: 0,
                totalDraws: 0,
                longestWinStreak: 0,
                currentWinStreak: 0
            }
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
        const stats = await db.query.profileStats.findFirst({
            where: eq(profileStats.userId, Number(userId))
        });

        const userRatings = await db.query.ratings.findMany({
            where: eq(ratings.userId, Number(userId))
        });

        return {
            stats: stats || {
                totalGames: 0,
                totalWins: 0,
                totalLosses: 0,
                totalDraws: 0,
                longestWinStreak: 0,
                currentWinStreak: 0
            },
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
}

export const profileService = new ProfileService();
