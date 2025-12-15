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

            console.log(`Matchmaking: User ${userId} is attempting to join queue for ${payload.timeControl}`);

            const rating = await matchmakingService.getPlayerRating(
                userId,
                payload.timeControl
            );

            console.log(`User ${userId} joined queue for ${payload.timeControl} with rating ${rating}`);

            await matchmakingService.enqueue({
                userId,
                rating,
                timeControl: payload.timeControl
            });

            console.log(`User ${userId} enqueued for ${payload.timeControl}`);

            socket.join(`queue:${payload.timeControl}`);
            socket.emit('queue:joined', { timeControl: payload.timeControl });

            // Try to match immediately
            const match = await matchmakingService.findMatch(payload.timeControl);
            if (match) {
                const { gameId, whitePlayerId, blackPlayerId } = match;

                await gameService.createInitialState(Number(gameId));

                // Put players into a game room
                const room = `game:${gameId}`;
                // Ensure both players' sockets are joined into the game room.
                // Find all connected sockets for both users and add them to the room.
                const sockets = io.sockets.sockets;
                for (const [id, s] of sockets) {
                    const sidUser = s.data.userId as string | undefined;
                    if (sidUser === whitePlayerId || sidUser === blackPlayerId) {
                        try {
                            s.join(room);
                            if (!s.data.games) s.data.games = new Set<string>();
                            (s.data.games as Set<string>).add(gameId);
                        } catch (e) {
                            // ignore per-socket join failures
                            console.log(`Failed to add socket ${id} to game room ${room}:`, e);
                        }
                    }
                }

                // Emit to the room so all joined sockets receive the event
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
