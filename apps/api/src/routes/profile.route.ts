import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router: Router = Router();

// Public routes
router.get('/search', profileController.searchUsers);
router.get('/leaderboard', profileController.getLeaderboard);
router.get('/:userId', profileController.getProfile);
router.get('/:userId/stats', profileController.getStats);

// Protected routes
router.patch('/me', authMiddleware, profileController.updateProfile);

export default router;
