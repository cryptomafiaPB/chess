// src/socket/handlers/voice.handler.ts
import { Server, Socket } from 'socket.io';
import { gameService } from '../../services/game.service';

interface VoiceInitPayload {
    gameId: string;
}

interface VoiceSignalPayload {
    gameId: string;
    targetUserId: string;
    sdp?: any;
    candidate?: any;
}

interface VoiceMutePayload {
    gameId: string;
    isMuted: boolean;
}

export function voiceHandler(io: Server, socket: Socket) {
    const userId = socket.data.userId as string | undefined;
    if (!socket.data.games) socket.data.games = new Set<string>();

    // Request to enable voice for this game
    socket.on('voice:init', async ({ gameId }: VoiceInitPayload) => {
        try {
            if (!userId) return;

            const game = await gameService.getGameRow(gameId);
            const whiteId = game.whitePlayerId.toString();
            const blackId = game.blackPlayerId.toString();
            const isPlayer = userId === whiteId || userId === blackId;

            if (!isPlayer) {
                return socket.emit('voice:error', {
                    gameId,
                    message: 'Only players can use voice chat',
                });
            }

            const room = `game:${gameId}`;
            socket.join(room);
            (socket.data.games as Set<string>).add(gameId);

            const opponentId = userId === whiteId ? blackId : whiteId;

            // ✅ Notify only the opponent that this user is ready for voice
            io.to(`user:${opponentId}`).emit('voice:ready', {
                gameId,
                userId,       // caller
                targetUserId: opponentId,
            });
        } catch (err) {
            socket.emit('voice:error', {
                gameId,
                message: 'Failed to init voice',
            });
        }
    });

    // SDP offer from caller -> callee
    socket.on('voice:offer', (payload: VoiceSignalPayload) => {
        if (!userId) return;

        const { gameId, targetUserId, sdp } = payload;

        // ✅ send only to target user, not entire game room
        io.to(`user:${targetUserId}`).emit('voice:offer', {
            gameId,
            fromUserId: userId,
            toUserId: targetUserId,
            sdp,
        });
    });

    // SDP answer from callee -> caller
    socket.on('voice:answer', (payload: VoiceSignalPayload) => {
        if (!userId) return;

        const { gameId, targetUserId, sdp } = payload;

        // ✅ send only to target user
        io.to(`user:${targetUserId}`).emit('voice:answer', {
            gameId,
            fromUserId: userId,
            toUserId: targetUserId,
            sdp,
        });
    });

    // ICE candidates
    socket.on('voice:ice-candidate', (payload: VoiceSignalPayload) => {
        if (!userId) return;

        const { gameId, targetUserId, candidate } = payload;

        // ✅ send only to target user
        io.to(`user:${targetUserId}`).emit('voice:ice-candidate', {
            gameId,
            fromUserId: userId,
            toUserId: targetUserId,
            candidate,
        });
    });

    // Local mute status (for UI indicator on opponent side)
    socket.on('voice:mute-status', (payload: VoiceMutePayload) => {
        if (!userId) return;

        const { gameId, isMuted } = payload;

        socket.to(`game:${gameId}`).emit('voice:mute-status', {
            gameId,
            userId,
            isMuted,
        });
    });

    // Optional: explicit hangup
    socket.on('voice:hangup', ({ gameId }: { gameId: string }) => {
        if (!userId) return;
        socket.to(`game:${gameId}`).emit('voice:hangup', { gameId, userId });
    });
}
