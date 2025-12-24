import { Server, Socket } from 'socket.io';
import { db } from '../../config/database';
import { eq } from 'drizzle-orm';
import { games } from '../../schema/game.schema';
import { gameService } from '../../services/game.service';
import { presenceService } from '../../services/presence.service';

export async function reconnectionHandler(io: Server, socket: Socket) {
    const userId = socket.data.userId as string | undefined;

    if (!userId) return;

    try {
        // Find all active games for this user
        const userGames = await db.query.games.findMany({
            where: eq(games.status, 'active')
        });

        const activeGameIds: string[] = [];

        for (const gameRow of userGames) {
            let role: 'white' | 'black' | null = null;

            if (userId === gameRow.whitePlayerId.toString()) {
                role = 'white';
            } else if (userId === gameRow.blackPlayerId.toString()) {
                role = 'black';
            }

            if (!role) continue;

            const gameId = gameRow.id.toString();
            activeGameIds.push(gameId);

            // Re-join the game room
            const room = `game:${gameId}`;
            socket.join(room);

            // Mark player as back online
            await presenceService.markOnline(gameId, role);

            // Notify other players in this game of reconnection
            io.to(room).emit('game:presence', {
                gameId,
                userId,
                role,
                status: 'online'
            });

            // Send full game state to the reconnected player
            try {
                const fullState = await gameService.getFullState(gameId);
                socket.emit('game:state', {
                    ...fullState,
                    role
                });
            } catch (err) {
                console.error(`Failed to fetch game state for ${gameId}:`, err);
            }
        }

        // Store the active games in socket data for future disconnect handling
        if (!socket.data.games) socket.data.games = new Set<string>();
        activeGameIds.forEach(gameId => {
            (socket.data.games as Set<string>).add(gameId);
        });

        console.log(
            `✅ User ${userId} reconnected to ${activeGameIds.length} active game(s): [${activeGameIds.join(', ')}]`
        );
    } catch (err) {
        console.error(`Reconnection handler error for user ${userId}:`, err);
    }
}
