import type { Request, Response } from 'express';
import { dmService } from '../services/dm.service';

export class DMController {
    // Get all conversations
    async getConversations(req: Request, res: Response) {
        try {
            const userId = Number(req.user!.userId);
            const conversations = await dmService.getConversations(userId);

            res.json({
                success: true,
                data: conversations
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get conversations'
            });
        }
    }

    // Get messages with a friend
    async getMessages(req: Request, res: Response) {
        try {
            const userId = Number(req.user!.userId);
            const friendId = Number(req.params.friendId);
            const limit = Math.min(Number(req.query.limit) || 50, 100);
            const before = req.query.before ? Number(req.query.before) : undefined;

            if (!friendId || isNaN(friendId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Friend ID is required'
                });
            }

            const messages = await dmService.getMessages(userId, friendId, limit, before);

            res.json({
                success: true,
                data: messages
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get messages'
            });
        }
    }

    // Send a message
    async sendMessage(req: Request, res: Response) {
        try {
            const userId = Number(req.user!.userId);
            const friendId = Number(req.params.friendId);
            const { message } = req.body;

            if (!friendId || isNaN(friendId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Friend ID is required'
                });
            }

            if (!message || typeof message !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            const dm = await dmService.sendMessage(userId, friendId, message);

            res.status(201).json({
                success: true,
                data: dm
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to send message'
            });
        }
    }

    // Mark messages as read
    async markAsRead(req: Request, res: Response) {
        try {
            const userId = Number(req.user!.userId);
            const friendId = Number(req.params.friendId);

            if (!friendId || isNaN(friendId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Friend ID is required'
                });
            }

            await dmService.markAsRead(userId, friendId);

            res.json({
                success: true,
                message: 'Messages marked as read'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to mark messages as read'
            });
        }
    }

    // Get unread count
    async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = Number(req.user!.userId);
            const count = await dmService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { count }
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get unread count'
            });
        }
    }
}

export const dmController = new DMController();
