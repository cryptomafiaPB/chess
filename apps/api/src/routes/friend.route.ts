import { Router } from 'express';
import { friendController } from '../controllers/friend.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// Friend management
router.post('/request', friendController.sendRequest);
router.post('/request/:requestId/accept', friendController.acceptRequest);
router.post('/request/:requestId/reject', friendController.rejectRequest);
router.delete('/request/:requestId', friendController.cancelRequest);
router.delete('/:friendId', friendController.removeFriend);

// Block management
router.post('/block', friendController.blockUser);
router.delete('/block/:userId', friendController.unblockUser);

// Lists
router.get('/list', friendController.getFriends);
router.get('/requests/pending', friendController.getPendingRequests);
router.get('/requests/sent', friendController.getSentRequests);
router.get('/blocked', friendController.getBlockedUsers);

// Status check
router.get('/status/:userId', friendController.getFriendshipStatus);

export default router;
