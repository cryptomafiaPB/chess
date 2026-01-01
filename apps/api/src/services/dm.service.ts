import { eq, and, or, desc, sql, asc } from 'drizzle-orm';
import { db } from '../config/database';
import { redis } from '../db/redis';
import { users } from 'schema/user.schema';
import { friendships } from 'schema/friendship.schema';
import { conversations, directMessages } from 'schema/direct-message.schema';

export interface DirectMessage {
    id: number;
    conversationId: number;
    senderId: number;
    senderUsername: string;
    senderAvatar: string | null;
    message: string;
    isRead: boolean;
    createdAt: string;
}

export interface Conversation {
    id: number;
    friendId: number;
    friendUsername: string;
    friendAvatar: string | null;
    lastMessage: string | null;
    lastMessageAt: string;
    unreadCount: number;
    isOnline: boolean;
}

export class DMService {
    // Check if two users are friends
    private async areFriends(userId1: number, userId2: number): Promise<boolean> {
        const friendship = await db.query.friendships.findFirst({
            where: and(
                or(
                    and(eq(friendships.userId, userId1), eq(friendships.friendId, userId2)),
                    and(eq(friendships.userId, userId2), eq(friendships.friendId, userId1))
                ),
                eq(friendships.status, 'active')
            )
        });
        return !!friendship;
    }

    // Get or create a conversation between two users
    async getOrCreateConversation(userId: number, friendId: number): Promise<number> {
        // Verify they are friends
        const areFriends = await this.areFriends(userId, friendId);
        if (!areFriends) {
            throw new Error('You can only message friends');
        }

        // Always store with smaller ID first for consistency
        const [user1, user2] = userId < friendId ? [userId, friendId] : [friendId, userId];

        // Check for existing conversation
        const existing = await db.query.conversations.findFirst({
            where: and(
                eq(conversations.user1Id, user1),
                eq(conversations.user2Id, user2)
            )
        });

        if (existing) {
            return existing.id;
        }

        // Create new conversation
        const [newConv] = await db.insert(conversations)
            .values({
                user1Id: user1,
                user2Id: user2
            })
            .returning();

        return newConv!.id;
    }

    // Send a direct message
    async sendMessage(senderId: number, friendId: number, message: string): Promise<DirectMessage> {
        const trimmedMessage = message.trim();
        if (!trimmedMessage) {
            throw new Error('Message cannot be empty');
        }

        if (trimmedMessage.length > 2000) {
            throw new Error('Message is too long (max 2000 characters)');
        }

        // Get or create conversation
        const conversationId = await this.getOrCreateConversation(senderId, friendId);

        // Insert message
        const [inserted] = await db.insert(directMessages)
            .values({
                conversationId,
                senderId,
                message: trimmedMessage
            })
            .returning();

        // Update conversation's last message time
        await db.update(conversations)
            .set({ lastMessageAt: new Date() })
            .where(eq(conversations.id, conversationId));

        // Get sender info
        const sender = await db.query.users.findFirst({
            where: eq(users.id, senderId),
            columns: { username: true, avatar_url: true }
        });

        const dm: DirectMessage = {
            id: inserted!.id,
            conversationId: inserted!.conversationId,
            senderId: inserted!.senderId,
            senderUsername: sender?.username ?? 'Unknown',
            senderAvatar: sender?.avatar_url ?? null,
            message: inserted!.message,
            isRead: inserted!.isRead,
            createdAt: inserted!.createdAt.toISOString()
        };

        // Publish message via Redis for real-time delivery
        await redis.publish('dm:message', JSON.stringify({
            type: 'dm:new',
            receiverId: friendId,
            message: dm
        }));

        return dm;
    }

    // Get messages for a conversation
    async getMessages(
        userId: number,
        friendId: number,
        limit: number = 50,
        before?: number
    ): Promise<DirectMessage[]> {
        const conversationId = await this.getOrCreateConversation(userId, friendId);

        let query = db
            .select({
                id: directMessages.id,
                conversationId: directMessages.conversationId,
                senderId: directMessages.senderId,
                message: directMessages.message,
                isRead: directMessages.isRead,
                createdAt: directMessages.createdAt,
                senderUsername: users.username,
                senderAvatar: users.avatar_url
            })
            .from(directMessages)
            .leftJoin(users, eq(users.id, directMessages.senderId))
            .where(
                before
                    ? and(
                        eq(directMessages.conversationId, conversationId),
                        sql`${directMessages.id} < ${before}`
                    )
                    : eq(directMessages.conversationId, conversationId)
            )
            .orderBy(desc(directMessages.createdAt))
            .limit(limit);

        const rows = await query;

        // Reverse to get chronological order
        return rows.reverse().map(row => ({
            id: row.id,
            conversationId: row.conversationId,
            senderId: row.senderId,
            senderUsername: row.senderUsername ?? 'Unknown',
            senderAvatar: row.senderAvatar ?? null,
            message: row.message,
            isRead: row.isRead,
            createdAt: row.createdAt.toISOString()
        }));
    }

    // Mark messages as read
    async markAsRead(userId: number, friendId: number): Promise<void> {
        const conversationId = await this.getOrCreateConversation(userId, friendId);

        await db.update(directMessages)
            .set({ isRead: true })
            .where(
                and(
                    eq(directMessages.conversationId, conversationId),
                    eq(directMessages.senderId, friendId),
                    eq(directMessages.isRead, false)
                )
            );

        // Notify sender that messages were read
        await redis.publish('dm:read', JSON.stringify({
            type: 'dm:read',
            conversationId,
            readBy: userId,
            notifyUser: friendId
        }));
    }

    // Get all conversations for a user
    async getConversations(userId: number): Promise<Conversation[]> {
        // Get all conversations where user is participant
        const convs = await db
            .select()
            .from(conversations)
            .where(
                or(
                    eq(conversations.user1Id, userId),
                    eq(conversations.user2Id, userId)
                )
            )
            .orderBy(desc(conversations.lastMessageAt));

        const result: Conversation[] = [];

        for (const conv of convs) {
            const friendId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;

            // Get friend info
            const friend = await db.query.users.findFirst({
                where: eq(users.id, friendId),
                columns: { id: true, username: true, avatar_url: true }
            });

            if (!friend) continue;

            // Get last message
            const lastMsg = await db
                .select({ message: directMessages.message })
                .from(directMessages)
                .where(eq(directMessages.conversationId, conv.id))
                .orderBy(desc(directMessages.createdAt))
                .limit(1);

            // Get unread count
            const unreadResult = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(directMessages)
                .where(
                    and(
                        eq(directMessages.conversationId, conv.id),
                        eq(directMessages.senderId, friendId),
                        eq(directMessages.isRead, false)
                    )
                );

            // Check if friend is online (from Redis)
            const isOnline = await redis.get(`user:online:${friendId}`);

            result.push({
                id: conv.id,
                friendId: friend.id,
                friendUsername: friend.username,
                friendAvatar: friend.avatar_url ?? null,
                lastMessage: lastMsg[0]?.message ?? null,
                lastMessageAt: conv.lastMessageAt.toISOString(),
                unreadCount: unreadResult[0]?.count ?? 0,
                isOnline: isOnline === 'true'
            });
        }

        return result;
    }

    // Get unread message count for a user
    async getUnreadCount(userId: number): Promise<number> {
        // Get all conversation IDs where user is participant
        const convIds = await db
            .select({ id: conversations.id, user1Id: conversations.user1Id, user2Id: conversations.user2Id })
            .from(conversations)
            .where(
                or(
                    eq(conversations.user1Id, userId),
                    eq(conversations.user2Id, userId)
                )
            );

        if (convIds.length === 0) return 0;

        let totalUnread = 0;
        for (const conv of convIds) {
            const senderId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
            const result = await db
                .select({ count: sql<number>`count(*)::int` })
                .from(directMessages)
                .where(
                    and(
                        eq(directMessages.conversationId, conv.id),
                        eq(directMessages.senderId, senderId),
                        eq(directMessages.isRead, false)
                    )
                );
            totalUnread += result[0]?.count ?? 0;
        }

        return totalUnread;
    }
}

export const dmService = new DMService();
