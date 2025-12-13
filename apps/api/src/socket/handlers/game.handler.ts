import { Server, Socket } from 'socket.io';
import { gameService } from '../../services/game.service';
import { presenceService } from 'services/presence.service';

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
            if (userId === whitePlayerId) role = 'white';
            else if (userId === blackPlayerId) role = 'black';

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
            }

            socket.emit('game:state', {
                ...fullState,
                role
            });
        } catch (err) {
            socket.emit('game:error', { message: 'Failed to join game' });
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

            io.to(`game:${payload.gameId}`).emit('game:move', {
                gameId: payload.gameId,
                move: res.move,
                fen: res.fen,
                clocks: res.clocks, // { white, black }
                gameOver: res.gameOver,
                result: res.result,
                resultReason: res.resultReason
            });
        } catch (e) {
            socket.emit('game:invalid-move', {
                gameId: payload.gameId,
                message: e instanceof Error ? e.message : 'Move failed'
            });
        }
    });

    socket.on('game:resign', async (payload: ResignPayload) => {
        try {
            if (!userId) return;

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
