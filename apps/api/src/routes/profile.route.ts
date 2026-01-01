import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router: Router = Router();

// Public routes
router.get('/search', profileController.searchUsers);
router.get('/leaderboard', profileController.getLeaderboard);

// Protected routes
router.get('/dashboard', authMiddleware, profileController.getDashboard);
router.patch('/me', authMiddleware, profileController.updateProfile);
router.post('/me/password', authMiddleware, profileController.changePassword);
router.patch('/me/avatar', authMiddleware, profileController.updateAvatar);
router.get('/me/preferences', authMiddleware, profileController.getPreferences);
router.patch('/me/preferences', authMiddleware, profileController.updatePreferences);
router.delete('/me', authMiddleware, profileController.deleteAccount);

// Public routes with params (must be after specific routes)
router.get('/:userId', profileController.getProfile);
router.get('/:userId/stats', profileController.getStats);

export default router;
