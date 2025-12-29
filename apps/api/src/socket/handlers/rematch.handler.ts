import { Server, Socket } from 'socket.io';
import { rematchService } from '../../services/rematch.service';
import { gameService } from '../../services/game.service';

interface RematchRequestPayload {
    gameId: string;
}

interface RematchResponsePayload {
    gameId: string;
}

export function rematchHandler(io: Server, socket: Socket) {
    const userId = socket.data.userId as string | undefined;

    // Player requests a rematch
    socket.on('rematch:request', async (payload: RematchRequestPayload) => {
        try {
            if (!userId) {
                socket.emit('rematch:error', { message: 'Not authenticated' });
                return;
            }

            const gameRow = await gameService.getGameRow(payload.gameId);

            // Determine opponent
            let opponentId: string;
            if (userId === gameRow.whitePlayerId.toString()) {
                opponentId = gameRow.blackPlayerId.toString();
            } else if (userId === gameRow.blackPlayerId.toString()) {
                opponentId = gameRow.whitePlayerId.toString();
            } else {
                socket.emit('rematch:error', { message: 'You are not a player in this game' });
                return;
            }

            const rematchRequest = await rematchService.createRematchRequest(
                payload.gameId,
                userId,
                opponentId
            );

            // Notify both players
            socket.emit('rematch:requested', {
                gameId: payload.gameId,
                requesterId: userId,
                expiresAt: rematchRequest.expiresAt
            });

            io.to(`user:${opponentId}`).emit('rematch:offered', {
                gameId: payload.gameId,
                requesterId: userId,
                expiresAt: rematchRequest.expiresAt
            });

            console.log(`🔄 Rematch requested for game ${payload.gameId} by user ${userId}`);
        } catch (err) {
            console.error('Rematch request error:', err);
            socket.emit('rematch:error', {
                message: err instanceof Error ? err.message : 'Failed to request rematch'
            });
        }
    });

    // Player accepts a rematch
    socket.on('rematch:accept', async (payload: RematchResponsePayload) => {
        try {
            if (!userId) {
                socket.emit('rematch:error', { message: 'Not authenticated' });
                return;
            }

            const result = await rematchService.acceptRematch(payload.gameId, userId);

            const gameRow = await gameService.getGameRow(payload.gameId);
            const requesterId = userId === gameRow.whitePlayerId.toString()
                ? gameRow.blackPlayerId.toString()
                : gameRow.whitePlayerId.toString();

            // Notify both players of the new game
            socket.emit('rematch:accepted', {
                oldGameId: payload.gameId,
                newGameId: result.newGameId
            });

            io.to(`user:${requesterId}`).emit('rematch:accepted', {
                oldGameId: payload.gameId,
                newGameId: result.newGameId
            });

            console.log(`✅ Rematch accepted for game ${payload.gameId}, new game: ${result.newGameId}`);
        } catch (err) {
            console.error('Rematch accept error:', err);
            socket.emit('rematch:error', {
                message: err instanceof Error ? err.message : 'Failed to accept rematch'
            });
        }
    });

    // Player declines a rematch
    socket.on('rematch:decline', async (payload: RematchResponsePayload) => {
        try {
            if (!userId) {
                socket.emit('rematch:error', { message: 'Not authenticated' });
                return;
            }

            await rematchService.declineRematch(payload.gameId, userId);

            const gameRow = await gameService.getGameRow(payload.gameId);
            const requesterId = userId === gameRow.whitePlayerId.toString()
                ? gameRow.blackPlayerId.toString()
                : gameRow.whitePlayerId.toString();

            // Notify both players
            socket.emit('rematch:declined', {
                gameId: payload.gameId
            });

            io.to(`user:${requesterId}`).emit('rematch:declined', {
                gameId: payload.gameId,
                declinerId: userId
            });

            console.log(`❌ Rematch declined for game ${payload.gameId} by user ${userId}`);
        } catch (err) {
            console.error('Rematch decline error:', err);
            socket.emit('rematch:error', {
                message: err instanceof Error ? err.message : 'Failed to decline rematch'
            });
        }
    });

    // Player cancels their rematch request
    socket.on('rematch:cancel', async (payload: RematchRequestPayload) => {
        try {
            if (!userId) {
                socket.emit('rematch:error', { message: 'Not authenticated' });
                return;
            }

            await rematchService.cancelRematchRequest(payload.gameId, userId);

            const gameRow = await gameService.getGameRow(payload.gameId);
            const opponentId = userId === gameRow.whitePlayerId.toString()
                ? gameRow.blackPlayerId.toString()
                : gameRow.whitePlayerId.toString();

            // Notify both players
            socket.emit('rematch:cancelled', {
                gameId: payload.gameId
            });

            io.to(`user:${opponentId}`).emit('rematch:cancelled', {
                gameId: payload.gameId
            });

            console.log(`🚫 Rematch cancelled for game ${payload.gameId} by user ${userId}`);
        } catch (err) {
            console.error('Rematch cancel error:', err);
            socket.emit('rematch:error', {
                message: err instanceof Error ? err.message : 'Failed to cancel rematch'
            });
        }
    });
}
