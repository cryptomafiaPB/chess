import type { Request } from 'express';
import type { Response } from 'express';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../utils/validation';
import { z } from 'zod';
import type { TokenPayload } from 'utils/jwt';

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export class AuthController {
    async register(req: Request, res: Response) {
        try {
            // Validate input
            const validatedData = registerSchema.parse(req.body);

            // Register user
            const result = await authService.register(validatedData);

            // Set refresh token in httpOnly cookie [web:34]
            res.cookie('refreshToken', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(201).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken
                }
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    errors: error.issues
                });
            }

            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Registration failed'
            });
        }
    }

    async login(req: Request, res: Response) {
        try {
            // Validate input
            const validatedData = loginSchema.parse(req.body);

            // Login user
            const result = await authService.login(validatedData);

            // Set refresh token in httpOnly cookie [web:34]
            res.cookie('refreshToken', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.status(200).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken
                }
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    errors: error.issues
                });
            }

            res.status(401).json({
                success: false,
                message: error instanceof Error ? error.message : 'Login failed'
            });
        }
    }

    async refreshToken(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token not found'
                });
            }

            // Refresh tokens [web:31][web:32]
            const tokens = await authService.refreshToken(refreshToken);

            // Set new refresh token in cookie
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.status(200).json({
                success: true,
                data: {
                    accessToken: tokens.accessToken
                }
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    }

    async logout(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
            }

            await authService.logout(userId);

            // Clear refresh token cookie
            res.clearCookie('refreshToken');

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
    }

    async me(req: Request, res: Response) {
        try {
            res.status(200).json({
                success: true,
                data: {
                    user: req.user
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get user info'
            });
        }
    }
}

export const authController = new AuthController();
