import { eq, or } from 'drizzle-orm';
import { db } from '../config/database';
// import { users, profiles, ratings } from '../db/schema';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateTokenPair, type TokenPayload, verifyRefreshToken } from '../utils/jwt';
import type { RegisterInput, LoginInput } from '../utils/validation';
import { redis } from 'db/redis';
import { users } from 'schema/user.schema';
import { profiles } from 'schema/profile.shema';
import { ratings } from 'schema/ratings.schema';

export class AuthService {
    // Register new user
    async register(data: RegisterInput) {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
            where: or(
                eq(users.email, data.email),
                eq(users.username, data.username)
            )
        });

        if (existingUser) {
            throw new Error('User with this email or username already exists');
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Create user
        const [user] = await db
            .insert(users)
            .values({
                email: data.email,
                username: data.username,
                hashed_password: hashedPassword
            })
            .returning();

        // Create profile
        await db.insert(profiles).values({
            userId: user!.id,
            preferences: {
                voiceEnabled: true,
                soundEnabled: true
            }
        });

        // Create default ratings for all time controls
        const timeControls = ['bullet', 'blitz', 'rapid', 'classical'];
        await db.insert(ratings).values(
            timeControls.map(tc => ({
                userId: user!.id,
                timeControl: tc,
                rating: 1200
            }))
        );

        // Generate tokens
        const tokenPayload: TokenPayload = {
            userId: String(user!.id),
            email: user!.email,
            username: user!.username
        };

        const tokens = generateTokenPair(tokenPayload);

        // Store refresh token in Redis [web:34]
        await redis.setex(
            `refresh_token:${user!.id}`,
            7 * 24 * 60 * 60, // 7 days
            tokens.refreshToken
        );

        return {
            user: {
                id: user!.id,
                email: user!.email,
                username: user!.username,
                avatar: user!.avatar_url
            },
            tokens
        };
    }

    // Login user
    async login(data: LoginInput) {
        // Find user by email
        const user = await db.query.users.findFirst({
            where: eq(users.email, data.email)
        });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isValidPassword = await verifyPassword(data.password, user.hashed_password);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }

        // Generate tokens
        const tokenPayload: TokenPayload = {
            userId: String(user.id),
            email: user.email,
            username: user.username
        };

        const tokens = generateTokenPair(tokenPayload);

        // Store refresh token in Redis [web:34]
        await redis.setex(
            `refresh_token:${user.id}`,
            7 * 24 * 60 * 60,
            tokens.refreshToken
        );

        // Update online status
        await db
            .update(profiles)
            .set({ isOnline: true })
            .where(eq(profiles.userId, user.id));

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar_url
            },
            tokens
        };
    }

    // Refresh access token [web:31][web:32]
    async refreshToken(refreshToken: string) {
        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);

        // Check if refresh token exists in Redis
        const storedToken = await redis.get(`refresh_token:${payload.userId}`);
        if (!storedToken || storedToken !== refreshToken) {
            throw new Error('Invalid refresh token');
        }

        // Generate new token pair [web:34]
        const newTokens = generateTokenPair({
            userId: payload.userId,
            email: payload.email,
            username: payload.username
        });

        // Update refresh token in Redis (token rotation)
        await redis.setex(
            `refresh_token:${payload.userId}`,
            7 * 24 * 60 * 60,
            newTokens.refreshToken
        );

        return newTokens;
    }

    // Logout user
    async logout(userId: string) {
        // Remove refresh token from Redis
        await redis.del(`refresh_token:${userId}`);

        // Update online status
        await db
            .update(profiles)
            .set({ isOnline: false })
            .where(eq(profiles.userId, Number(userId)));

        return { message: 'Logged out successfully' };
    }

    // Validate token (check if blacklisted)
    async validateToken(userId: string, token: string): Promise<boolean> {
        const storedToken = await redis.get(`refresh_token:${userId}`);
        return storedToken === token;
    }
}

export const authService = new AuthService();
