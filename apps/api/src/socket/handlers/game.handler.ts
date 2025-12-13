import { Server, Socket } from 'socket.io';
import { gameService } from '../../services/game.service';

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

export function gameHandler(io: Server, socket: Socket) {
  const userId = socket.data.userId as string | undefined;

  socket.on('game:join', async (payload: JoinGamePayload) => {
    try {
      if (!userId) return;

      const game = await gameService.getGame(payload.gameId);

      // Only players and spectators (future) can join
      socket.join(`game:${payload.gameId}`);

      socket.emit('game:joined', {
        gameId: payload.gameId,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId
      });
    } catch (err) {
      socket.emit('game:error', {
        message: err instanceof Error ? err.message : 'Failed to join game'
      });
    }
  });

  socket.on('game:move', async (payload: MovePayload) => {
    try {
      if (!userId) return;

      const result = await gameService.makeMove({
        gameId: payload.gameId,
        userId,
        from: payload.from,
        to: payload.to,
        ...(payload.promotion && { promotion: payload.promotion })
      });

      // Broadcast to all in room
      io.to(`game:${payload.gameId}`).emit('game:move', {
        gameId: payload.gameId,
        move: result.move,
        fen: result.fen,
        gameOver: result.gameOver,
        result: result.result,
        resultReason: result.resultReason
      });
    } catch (err) {
      socket.emit('game:invalid-move', {
        gameId: payload.gameId,
        message: err instanceof Error ? err.message : 'Move failed'
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
}
