import { pgTable, serial, varchar, text, timestamp, integer } from "drizzle-orm/pg-core";
import { games } from "./game.schema";
import { relations } from "drizzle-orm";

export const moves = pgTable("moves", {
    id: serial("id").primaryKey(),
    gameId: integer("game_id").notNull().references(() => games.id),
    move: text("move"),
    turn: integer("turn"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const moveRelations = relations(moves, ({ one }) => ({
    game: one(games, { fields: [moves.gameId], references: [games.id] }),
}));