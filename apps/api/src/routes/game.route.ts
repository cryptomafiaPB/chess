import { Router } from 'express';
import { gameController } from '../controllers/game.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router: Router = Router();

// Get game details (static data) - optional auth for determining role
router.get('/:gameId', optionalAuthMiddleware, gameController.getGameDetails.bind(gameController));

// Get full game state - optional auth for determining role
router.get('/:gameId/state', optionalAuthMiddleware, gameController.getGameState.bind(gameController));

export default router;
