import { Server, Socket } from 'socket.io';
import { gameService } from '../../services/game.service';
import { presenceService } from 'services/presence.service';
import { inactivityService } from 'services/inactivity.service';


interface JoinGamePayload {
    gameId: string;
}

interface MovePayload {
    gameId: string;
    from: string;
    to: string;
    promotion?: 'q' | 'r' | 'b' | 'n';
}

interface ResignPayload {
    gameId: string;
}

interface HintsPayload {
    gameId: string;
    from?: string; // e.g. "e2"
}

export function gameHandler(io: Server, socket: Socket) {
    const userId = socket.data.userId as string | undefined;

    if (!socket.data.games) socket.data.games = new Set<string>();

    socket.on('game:join', async (payload: JoinGamePayload) => {
        try {
            if (!userId) return;

            const fullState = await gameService.getFullState(payload.gameId);
            const { whitePlayerId, blackPlayerId } = fullState;

            let role: 'white' | 'black' | 'spectator' = 'spectator';
            if (userId === whitePlayerId.toString()) role = 'white';
            else if (userId === blackPlayerId.toString()) role = 'black';

            // Block ALL users (including players) from joining completed/aborted games
            // Game pages are only valid for active/waiting games
            // Players who were on the page when game ended can still see it until they leave
            if (fullState.status === 'completed' || fullState.status === 'aborted') {
                socket.emit('game:error', {
                    message: 'Game not found',
                    type: 'not_found'
                });
                return;
            }

            const room = `game:${payload.gameId}`;
            socket.join(room);
            (socket.data.games as Set<string>).add(payload.gameId);

            // Players affect presence; spectators do not.
            if (role === 'white' || role === 'black') {
                await presenceService.markOnline(payload.gameId, role);
                io.to(room).emit('game:presence', {
                    gameId: payload.gameId,
                    userId,
                    role,
                    status: 'online'
                });

                // Mark player as ready and check if both are ready
                const readyResult = await gameService.markPlayerReady(payload.gameId, role);

                if (readyResult.bothReady && readyResult.startTime) {
                    // Both players ready - game begins now!
                    // Emit to ALL sockets in the room (including this one)
                    io.to(room).emit('game:begin', {
                        gameId: payload.gameId,
                        startTime: readyResult.startTime,
                        serverTime: Date.now()
                    });

                    // Start inactivity timer now that game has begun
                    await inactivityService.startInactivityTimer(payload.gameId, 'white', io);

                    // Update fullState to reflect active status for the state emit below
                    fullState.status = 'active';
                    fullState.clocks.lastMoveAt = readyResult.startTime;
                }
            }

            // If game is already active (e.g., reconnection or second player joined after first)
            // send the current inactivity state
            if (fullState.status === 'active' && !fullState.isExpired) {
                const inactivityState = await inactivityService.getRemainingTime(payload.gameId);
                if (inactivityState) {
                    socket.emit('game:inactivity-sync', {
                        gameId: payload.gameId,
                        activeColor: inactivityState.activeColor,
                        remainingMs: inactivityState.remainingMs,
                        serverTime: Date.now()
                    });
                }
            }

            socket.emit('game:state', {
                ...fullState,
                role,
                serverTime: Date.now()
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to join game';
            const errorType = message === 'Game not found' ? 'not_found' : 'error';
            socket.emit('game:error', { message, type: errorType });
        }
    });


    socket.on('game:move', async (payload: MovePayload) => {
        try {
            if (!userId) return;

            const res = await gameService.makeMove({
                gameId: payload.gameId,
                userId,
                from: payload.from,
                to: payload.to,
                ...(payload.promotion && { promotion: payload.promotion })
            });

            // Cancel current inactivity timer
            await inactivityService.cancelInactivityTimer(payload.gameId, io);

            io.to(`game:${payload.gameId}`).emit('game:move', {
                gameId: payload.gameId,
                move: res.move,
                fen: res.fen,
                clocks: res.clocks,
                gameOver: res.gameOver,
                result: res.result,
                resultReason: res.resultReason,
                serverTime: res.serverTime ?? Date.now()
            });

            // Start new inactivity timer for the next player if game is not over
            if (!res.gameOver && res.clocks?.activeColor) {
                await inactivityService.startInactivityTimer(
                    payload.gameId,
                    res.clocks.activeColor as 'white' | 'black',
                    io
                );
            }
        } catch (e) {
            console.log('Error making move:', e);
            socket.emit('game:invalid-move', {
                gameId: payload.gameId,
                message: e instanceof Error ? e.message : 'Move failed'
            });
        }
    });

    socket.on('game:resign', async (payload: ResignPayload) => {
        try {
            if (!userId) return;

            // Cancel inactivity timer when game ends
            await inactivityService.cancelInactivityTimer(payload.gameId, io);

            const result = await gameService.resign(payload.gameId, userId);

            io.to(`game:${payload.gameId}`).emit('game:ended', {
                gameId: payload.gameId,
                result: result.result,
                resultReason: result.resultReason
            });
        } catch (err) {
            socket.emit('game:error', {
                message: err instanceof Error ? err.message : 'Failed to resign'
            });
        }
    });

    // Draw offer tracking - stored in socket data per game
    socket.on('game:draw-offer', async (payload: { gameId: string }) => {
        try {
            if (!userId) return;

            const fullState = await gameService.getFullState(payload.gameId);
            const { whitePlayerId, blackPlayerId, status } = fullState;

            if (status !== 'active') {
                socket.emit('game:error', { message: 'Game is not active' });
                return;
            }

            let role: 'white' | 'black' | null = null;
            if (userId === whitePlayerId.toString()) role = 'white';
            else if (userId === blackPlayerId.toString()) role = 'black';

            if (!role) {
                socket.emit('game:error', { message: 'Only players can offer draw' });
                return;
            }

            const room = `game:${payload.gameId}`;
            io.to(room).emit('game:draw-offer', {
                gameId: payload.gameId,
                offeredBy: role,
            });
        } catch (err) {
            socket.emit('game:error', {
                message: err instanceof Error ? err.message : 'Failed to offer draw'
            });
        }
    });

    socket.on('game:draw-accept', async (payload: { gameId: string }) => {
        try {
            if (!userId) return;

            // Cancel inactivity timer when game ends
            await inactivityService.cancelInactivityTimer(payload.gameId, io);

            const result = await gameService.endGameAsDraw(payload.gameId);

            io.to(`game:${payload.gameId}`).emit('game:ended', {
                gameId: payload.gameId,
                result: result.result,
                resultReason: result.resultReason
            });
        } catch (err) {
            socket.emit('game:error', {
                message: err instanceof Error ? err.message : 'Failed to accept draw'
            });
        }
    });

    socket.on('game:draw-decline', async (payload: { gameId: string }) => {
        try {
            if (!userId) return;

            io.to(`game:${payload.gameId}`).emit('game:draw-declined', {
                gameId: payload.gameId,
            });
        } catch (err) {
            socket.emit('game:error', {
                message: err instanceof Error ? err.message : 'Failed to decline draw'
            });
        }
    });

    socket.on('game:draw-cancel', async (payload: { gameId: string }) => {
        try {
            if (!userId) return;

            io.to(`game:${payload.gameId}`).emit('game:draw-cancelled', {
                gameId: payload.gameId,
            });
        } catch (err) {
            socket.emit('game:error', {
                message: err instanceof Error ? err.message : 'Failed to cancel draw'
            });
        }
    });

    socket.on('game:hints', async (payload: HintsPayload) => {
        try {
            if (!userId) return;

            const moves = await gameService.getLegalMoves(
                payload.gameId,
                userId,
                payload.from
            );

            socket.emit('game:hints', {
                gameId: payload.gameId,
                from: payload.from,
                moves // [{from,to,san,promotion?}]
            });
        } catch (err) {
            socket.emit('game:error', {
                message:
                    err instanceof Error ? err.message : 'Failed to get hints'
            });
        }
    });
}
