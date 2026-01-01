import { Router } from 'express';
import { dmController } from '../controllers/dm.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all conversations
router.get('/conversations', dmController.getConversations);

// Get unread message count
router.get('/unread', dmController.getUnreadCount);

// Get messages with a specific friend
router.get('/messages/:friendId', dmController.getMessages);

// Send a message to a friend
router.post('/messages/:friendId', dmController.sendMessage);

// Mark messages from a friend as read
router.post('/messages/:friendId/read', dmController.markAsRead);

export default router;
