import { Router } from 'express';
import { gameController } from '../controllers/game.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router: Router = Router();

// Get user's game history - requires auth
router.get('/history/me', authMiddleware, gameController.getMyGameHistory.bind(gameController));

// Get game details (static data) - optional auth for determining role
router.get('/:gameId', optionalAuthMiddleware, gameController.getGameDetails.bind(gameController));

// Get full game state - optional auth for determining role
router.get('/:gameId/state', optionalAuthMiddleware, gameController.getGameState.bind(gameController));

export default router;
