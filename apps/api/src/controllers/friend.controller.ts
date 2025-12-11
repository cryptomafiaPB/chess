import type { Request, Response } from 'express';
import { friendService } from '../services/friend.service';

export class FriendController {
    async sendRequest(req: Request, res: Response) {
        try {
            const senderId = req.user!.userId;
            const { receiverId } = req.body;

            const request = await friendService.sendFriendRequest(senderId, receiverId);

            res.status(201).json({
                success: true,
                data: request
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to send request'
            });
        }
    }

    async acceptRequest(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { requestId } = req.params;

            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    message: 'Request ID is required'
                });
            }

            const result = await friendService.acceptFriendRequest(userId, requestId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to accept request'
            });
        }
    }

    async rejectRequest(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { requestId } = req.params;

            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    message: 'Request ID is required'
                });
            }

            const result = await friendService.rejectFriendRequest(userId, requestId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to reject request'
            });
        }
    }

    async cancelRequest(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { requestId } = req.params;

            if (!requestId) {
                return res.status(400).json({
                    success: false,
                    message: 'Request ID is required'
                });
            }

            const result = await friendService.cancelFriendRequest(userId, requestId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to cancel request'
            });
        }
    }

    async removeFriend(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { friendId } = req.params;

            if (!friendId) {
                return res.status(400).json({
                    success: false,
                    message: 'Friend ID is required'
                });
            }

            const result = await friendService.removeFriend(userId, friendId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to remove friend'
            });
        }
    }

    async blockUser(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { userId: blockUserId } = req.body;

            const result = await friendService.blockUser(userId, blockUserId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to block user'
            });
        }
    }

    async unblockUser(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { userId: unblockUserId } = req.params;

            if (!unblockUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const result = await friendService.unblockUser(userId, unblockUserId);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to unblock user'
            });
        }
    }

    async getFriends(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;

            const friends = await friendService.getFriends(userId);

            res.json({
                success: true,
                data: friends
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch friends'
            });
        }
    }

    async getPendingRequests(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;

            const requests = await friendService.getPendingRequests(userId);

            res.json({
                success: true,
                data: requests
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch requests'
            });
        }
    }

    async getSentRequests(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;

            const requests = await friendService.getSentRequests(userId);

            res.json({
                success: true,
                data: requests
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch sent requests'
            });
        }
    }

    async getBlockedUsers(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;

            const blocked = await friendService.getBlockedUsers(userId);

            res.json({
                success: true,
                data: blocked
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch blocked users'
            });
        }
    }

    async getFriendshipStatus(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { userId: targetUserId } = req.params;

            if (!targetUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const status = await friendService.getFriendshipStatus(userId, targetUserId);

            res.json({
                success: true,
                data: { status }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to get friendship status'
            });
        }
    }
}

export const friendController = new FriendController();
