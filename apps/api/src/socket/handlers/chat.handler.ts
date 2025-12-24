import { Server, Socket } from 'socket.io';
import { db } from 'config/database';
import { chatMessages } from 'schema/chat.schema';
import { users } from 'schema/user.schema';
import { eq, desc } from 'drizzle-orm';

type ChatMessagePayload = {
    id: number;
    gameId: number;
    userId: number;
    username?: string | null;
    text: string;
    createdAt: string;
};

export function chatHandler(io: Server, socket: Socket) {
    const userId = socket.data.userId as string | undefined;

    socket.on('chat:join', async (payload: { gameId: string }) => {
        try {
            const { gameId } = payload;
            if (!gameId) return;
            const room = `game:${gameId}`;
            socket.join(room);

            // Load recent messages (latest 100)
            const rows = await db
                .select({
                    id: chatMessages.id,
                    gameId: chatMessages.gameId,
                    senderId: chatMessages.senderId,
                    message: chatMessages.message,
                    createdAt: chatMessages.createdAt,
                    username: users.username
                })
                .from(chatMessages)
                .leftJoin(users, eq(users.id, chatMessages.senderId))
                .where(eq(chatMessages.gameId, Number(gameId)))
                .orderBy(desc(chatMessages.createdAt))
                .limit(100);

            // reverse to chronological order
            const msgs: ChatMessagePayload[] = rows.reverse().map((r: any) => ({
                id: Number(r.id),
                gameId: Number(r.gameId),
                userId: Number(r.senderId),
                username: r.username ?? null,
                text: r.message,
                createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
            }));

            socket.emit('chat:history', { gameId, messages: msgs });
        } catch (err) {
            socket.emit('chat:error', { message: 'Failed to join chat' });
        }
    });

    socket.on('chat:leave', (payload: { gameId: string }) => {
        const { gameId } = payload;
        if (!gameId) return;
        socket.leave(`game:${gameId}`);
    });

    socket.on('chat:message', async (payload: { gameId: string; text: string }, cb?: () => void) => {
        try {
            if (!userId) return;
            const { gameId, text } = payload;
            const trimmed = (text ?? '').trim();
            if (!trimmed) return;

            // Persist to DB
            const [inserted] = await db.insert(chatMessages).values({
                gameId: Number(gameId),
                senderId: Number(userId),
                message: trimmed
            }).returning();

            if (!inserted) {
                socket.emit('chat:error', { message: 'Failed to save message' });
                return;
            }

            // fetch username (joined above would have this already but ensure here)
            const userRow = await db.query.users.findFirst({
                where: eq(users.id, Number(userId)),
                columns: { username: true }
            });

            const msg: ChatMessagePayload = {
                id: Number(inserted.id),
                gameId: Number(inserted.gameId),
                userId: Number(inserted.senderId),
                username: userRow?.username ?? null,
                text: inserted.message,
                createdAt: inserted.createdAt instanceof Date ? inserted.createdAt.toISOString() : String(inserted.createdAt)
            };

            io.to(`game:${gameId}`).emit('chat:message', msg);

            if (typeof cb === 'function') cb();
        } catch (err) {
            socket.emit('chat:error', { message: 'Failed to send message' });
        }
    });
}

export default chatHandler;