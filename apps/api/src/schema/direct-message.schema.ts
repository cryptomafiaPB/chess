import { integer, pgTable, serial, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

// Conversation table to track DM threads between users
export const conversations = pgTable('conversations', {
    id: serial('id').primaryKey(),
    user1Id: integer('user1_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    user2Id: integer('user2_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
    user1Idx: index('conv_user1_idx').on(table.user1Id),
    user2Idx: index('conv_user2_idx').on(table.user2Id),
    lastMsgIdx: index('conv_last_msg_idx').on(table.lastMessageAt)
}));

// Direct messages table
export const directMessages = pgTable('direct_messages', {
    id: serial('id').primaryKey(),
    conversationId: integer('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
    senderId: integer('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
    convIdx: index('dm_conv_idx').on(table.conversationId),
    senderIdx: index('dm_sender_idx').on(table.senderId),
    createdAtIdx: index('dm_created_at_idx').on(table.createdAt)
}));
