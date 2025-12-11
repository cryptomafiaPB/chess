import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const friendRequests = pgTable('friend_requests', {
    id: serial('id').primaryKey(),
    senderId: integer('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    receiverId: integer('receiver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, accepted, rejected, cancelled
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});