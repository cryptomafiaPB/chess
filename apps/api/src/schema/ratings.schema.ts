import { integer, pgTable, serial, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const ratings = pgTable('ratings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    timeControl: varchar('time_control', { length: 20 }).notNull(), // bullet, blitz, rapid, classical
    rating: integer('rating').default(1200).notNull(),
    gamesPlayed: integer('games_played').default(0).notNull(),
    wins: integer('wins').default(0).notNull(),
    losses: integer('losses').default(0).notNull(),
    draws: integer('draws').default(0).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});