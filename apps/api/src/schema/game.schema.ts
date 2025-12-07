import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { relations } from "drizzle-orm";

export const games = pgTable("games", {
    id: serial("id").primaryKey(),
    whitePlayerId: integer("white_player_id").notNull().references(() => users.id),
    blackPlayerId: integer("black_player_id").notNull().references(() => users.id),
    timeControl: varchar('time_control', { length: 20 }).notNull(), // bullet, blitz, rapid, classical
    result: varchar('result', { length: 20 }), // white_wins, black_wins, draw
    status: varchar("status", { length: 20 }).default("active").notNull(), // active, completed, abandoned
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at')
})

export const gameRelations = relations(games, ({ one }) => ({
    whitePlayer: one(users, { fields: [games.whitePlayerId], references: [users.id] }),
    blackPlayer: one(users, { fields: [games.blackPlayerId], references: [users.id] }),
}));