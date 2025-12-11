import type { Request, Response } from 'express';
import { profileService } from '../services/profile.service';

export class ProfileController {
    async getProfile(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const requesterId = req.user?.userId;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const profile = await profileService.getProfile(userId!, requesterId);

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error instanceof Error ? error.message : 'Profile not found'
            });
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const data = req.body;

            const profile = await profileService.updateProfile(userId, data);

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Update failed'
            });
        }
    }

    async getStats(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const stats = await profileService.getStats(userId);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: 'Stats not found'
            });
        }
    }

    async searchUsers(req: Request, res: Response) {
        try {
            const { q, limit } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query required'
                });
            }

            const results = await profileService.searchUsers(
                q,
                limit ? parseInt(limit as string) : 10
            );

            res.json({
                success: true,
                data: results
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Search failed'
            });
        }
    }

    async getLeaderboard(req: Request, res: Response) {
        try {
            const { timeControl, limit } = req.query;

            if (!timeControl || typeof timeControl !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Time control required'
                });
            }

            const leaderboard = await profileService.getLeaderboard(
                timeControl,
                limit ? parseInt(limit as string) : 50
            );

            res.json({
                success: true,
                data: leaderboard
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch leaderboard'
            });
        }
    }
}

export const profileController = new ProfileController();
