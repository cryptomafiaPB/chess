import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { gameHandler } from './handlers/game.handler';
// import { chatHandler } from './handlers/chat.handler';
// import { voiceHandler } from './handlers/voice.handler';
import { matchmakingHandler } from './handlers/matchmaking.handler';
import { presenceService } from 'services/presence.service';
import { gameService } from 'services/game.service';
import { voiceHandler } from './handlers/voice.handler';
import { socketAuthHandler } from './handlers/socket-auth.handler';
import { chatHandler } from './handlers/chat.handler';
import { reconnectionHandler } from './handlers/reconnection.handler';

export const initializeSocket = (io: Server) => {
    io.on('connection', async (socket) => {
        // Parse JWT from handshake.auth or headers and set socket.data.userId.
        // Client sends: auth: () => ({ token: `Bearer ${token}` })

        socketAuthHandler(socket, (err?: any) => {
            if (err) {
                console.log(`❌ Socket auth error for ${socket.id}:`, err);
                return;
            }
        });

        if (socket.data.userId) {
            socket.join(`user:${socket.data.userId}`);
        }

        console.log(`✅ Client connected: ${socket.id} (user:${socket.data.userId})`);

        gameHandler(io, socket);
        chatHandler(io, socket);
        voiceHandler(io, socket);
        matchmakingHandler(io, socket);

        // Handle reconnection - restore game sessions
        await reconnectionHandler(io, socket);

        socket.on('disconnect', async () => {
            const userId = socket.data.userId as string | undefined;
            const gamesSet = socket.data.games as Set<string> | undefined;
            if (!userId || !gamesSet) return;

            for (const gameId of gamesSet) {
                try {
                    const gameRow = await gameService.getGameRow(gameId);

                    let role: 'white' | 'black' | null = null;
                    if (userId === gameRow.whitePlayerId.toString()) role = 'white';
                    else if (userId === gameRow.blackPlayerId.toString()) role = 'black';

                    if (!role) continue;

                    await presenceService.markOffline(gameId, role);

                    io.to(`game:${gameId}`).emit('game:presence', {
                        gameId,
                        userId,
                        role,
                        status: 'offline'
                    });

                    // schedule timeout check
                    setTimeout(() => {
                        presenceService.checkTimeout(gameId, io).catch(() => { });
                    }, 5_000); // small delay; actual timeout is in Redis timestamps
                } catch {
                    // ignore
                }
            }
        });
    });
};
