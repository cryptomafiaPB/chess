import { Server, Socket } from 'socket.io';
import { matchmakingService } from '../../services/matchmaking.service';
import { gameService } from '../../services/game.service';

type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical';

interface QueueJoinPayload {
    timeControl: TimeControl;
}

export function matchmakingHandler(io: Server, socket: Socket) {
    // Attach userId from auth token passed in handshake query/headers in your gateway.
    const userId = socket.data.userId as string | undefined;

    if (!userId) {
        // Optionally disconnect or just ignore matchmaking events
    }

    socket.on('queue:join', async (payload: QueueJoinPayload) => {
        try {
            if (!userId) return;

            const rating = await matchmakingService.getPlayerRating(
                userId,
                payload.timeControl
            );

            await matchmakingService.enqueue({
                userId,
                rating,
                timeControl: payload.timeControl
            });

            socket.join(`queue:${payload.timeControl}`);
            socket.emit('queue:joined', { timeControl: payload.timeControl });

            // Try to match immediately
            const match = await matchmakingService.findMatch(payload.timeControl);
            if (match) {
                const { gameId, whitePlayerId, blackPlayerId } = match;

                await gameService.createInitialState(gameId);

                // Put players into a game room
                const room = `game:${gameId}`;
                io.to(socket.id).socketsJoin(room); // ensure this socket is joined if it is involved

                // Emit to both players by their userId -> you should maintain userId ↔ socketId mapping
                io.to(room).emit('game:started', {
                    gameId,
                    whitePlayerId,
                    blackPlayerId,
                    timeControl: payload.timeControl
                });
            }
        } catch (err) {
            socket.emit('queue:error', {
                message: err instanceof Error ? err.message : 'Queue failed'
            });
        }
    });

    socket.on('queue:leave', async (payload: QueueJoinPayload) => {
        try {
            if (!userId) return;
            await matchmakingService.dequeue(userId, payload.timeControl);
            socket.leave(`queue:${payload.timeControl}`);
            socket.emit('queue:left', { timeControl: payload.timeControl });
        } catch (err) {
            socket.emit('queue:error', {
                message: err instanceof Error ? err.message : 'Failed to leave queue'
            });
        }
    });
}
