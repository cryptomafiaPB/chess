import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { relations } from "drizzle-orm";

export const games = pgTable("games", {
    id: serial("id").primaryKey(),
    whitePlayerId: integer("white_player_id").notNull().references(() => users.id),
    blackPlayerId: integer("black_player_id").notNull().references(() => users.id),
    status: varchar("status", { length: 50 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const gameRelations = relations(games, ({ one }) => ({
    whitePlayer: one(users, { fields: [games.whitePlayerId], references: [users.id] }),
    blackPlayer: one(users, { fields: [games.blackPlayerId], references: [users.id] }),
}));