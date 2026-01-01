import { type Request, type Response, type NextFunction } from 'express';
import { gameService } from '../services/game.service';

export class GameController {
    /**
     * Get user's game history
     * GET /api/v1/games/history/me
     */
    async getMyGameHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }
            const limit = parseInt(req.query.limit as string) || 20;
            const offset = parseInt(req.query.offset as string) || 0;

            const history = await gameService.getUserGameHistory(userId, limit, offset);
            return res.json(history);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get static game details (player info, time control, etc.)
     * GET /api/v1/games/:gameId
     */
    async getGameDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { gameId } = req.params;

            if (!gameId) {
                return res.status(400).json({ error: 'Game ID is required' });
            }

            const details = await gameService.getGameDetails(gameId);
            return res.json(details);
        } catch (error) {
            if (error instanceof Error && error.message === 'Game not found') {
                return res.status(404).json({ error: 'Game not found' });
            }
            next(error);
        }
    }

    /**
     * Get full game state (includes dynamic state like FEN, clocks)
     * GET /api/v1/games/:gameId/state
     */
    async getGameState(req: Request, res: Response, next: NextFunction) {
        try {
            const { gameId } = req.params;
            const userId = (req as any).userId;

            if (!gameId) {
                return res.status(400).json({ error: 'Game ID is required' });
            }

            const fullState = await gameService.getFullState(gameId);

            // Determine role
            let role: 'white' | 'black' | 'spectator' = 'spectator';
            if (userId) {
                if (userId === fullState.whitePlayerId.toString()) role = 'white';
                else if (userId === fullState.blackPlayerId.toString()) role = 'black';
            }

            return res.json({
                ...fullState,
                role
            });
        } catch (error) {
            if (error instanceof Error && error.message === 'Game not found') {
                return res.status(404).json({ error: 'Game not found' });
            }
            next(error);
        }
    }
}

export const gameController = new GameController();
