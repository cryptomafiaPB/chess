import { integer, pgTable, serial, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const friendships = pgTable('friendships', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    friendId: integer('friend_id').references(() => users.id).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, accepted, blocked
    createdAt: timestamp('created_at').defaultNow().notNull()
});