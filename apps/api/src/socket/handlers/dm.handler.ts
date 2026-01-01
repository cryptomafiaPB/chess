import { Server, Socket } from 'socket.io';
import { dmService } from 'services/dm.service';
import type { DirectMessage } from 'services/dm.service';

export function dmHandler(io: Server, socket: Socket) {
    const userId = socket.data.userId as string | undefined;

    if (!userId) return;

    // Join user's personal DM room
    socket.join(`dm:user:${userId}`);
    console.log(`👤 User ${userId} joined DM room: dm:user:${userId}`);

    // Handle sending a direct message via socket
    socket.on('dm:send', async (payload: { friendId: number; message: string }, cb?: (response: { success: boolean; message?: DirectMessage; error?: string }) => void) => {
        try {
            const { friendId, message } = payload;

            if (!friendId || !message) {
                if (cb) cb({ success: false, error: 'Friend ID and message are required' });
                return;
            }

            const dm = await dmService.sendMessage(Number(userId), friendId, message);

            console.log(`📤 DM sent from ${userId} to ${friendId}:`, dm.id);

            // Send to receiver's room
            io.to(`dm:user:${friendId}`).emit('dm:receive', dm);

            // Also emit to sender's other devices/tabs (excluding current socket)
            socket.to(`dm:user:${userId}`).emit('dm:receive', dm);

            // Confirm to sender via callback
            if (cb) cb({ success: true, message: dm });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
            console.error(`❌ DM send error:`, errorMessage);
            if (cb) cb({ success: false, error: errorMessage });
            socket.emit('dm:error', { message: errorMessage });
        }
    });

    // Handle typing indicator
    socket.on('dm:typing', (payload: { friendId: number; isTyping: boolean }) => {
        const { friendId, isTyping } = payload;
        if (!friendId) return;

        io.to(`dm:user:${friendId}`).emit('dm:typing', {
            userId: Number(userId),
            isTyping
        });
    });

    // Handle marking messages as read
    socket.on('dm:markRead', async (payload: { friendId: number }, cb?: (response: { success: boolean; error?: string }) => void) => {
        try {
            const { friendId } = payload;
            if (!friendId) {
                if (cb) cb({ success: false, error: 'Friend ID is required' });
                return;
            }

            await dmService.markAsRead(Number(userId), friendId);

            console.log(`✓ User ${userId} read messages from ${friendId}`);

            // Notify the friend that their messages were read
            io.to(`dm:user:${friendId}`).emit('dm:messagesRead', {
                userId: Number(userId)
            });

            if (cb) cb({ success: true });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to mark as read';
            if (cb) cb({ success: false, error: errorMessage });
        }
    });

    // Handle requesting message history
    socket.on('dm:getHistory', async (payload: { friendId: number; limit?: number; before?: number }, cb?: (response: { success: boolean; messages?: DirectMessage[]; error?: string }) => void) => {
        try {
            const { friendId, limit = 50, before } = payload;

            if (!friendId) {
                if (cb) cb({ success: false, error: 'Friend ID is required' });
                return;
            }

            const messages = await dmService.getMessages(Number(userId), friendId, limit, before);

            if (cb) cb({ success: true, messages });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to get messages';
            if (cb) cb({ success: false, error: errorMessage });
        }
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
        console.log(`👋 User ${userId} left DM room`);
        socket.leave(`dm:user:${userId}`);
    });
}
