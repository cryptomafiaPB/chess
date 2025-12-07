import { integer, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { games } from "./game.schema";

export const chatMessages = pgTable('chat_messages', {
    id: serial('id').primaryKey(),
    gameId: integer('game_id').references(() => games.id).notNull(),
    senderId: integer('sender_id').references(() => users.id).notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});