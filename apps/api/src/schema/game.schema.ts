import { pgTable, serial, varchar, text, timestamp, integer, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const games = pgTable("games", {
    id: uuid('id').defaultRandom().primaryKey(),
    whitePlayerId: uuid("white_player_id").notNull().references(() => users.id),
    blackPlayerId: uuid("black_player_id").notNull().references(() => users.id),
    mode: varchar('mode', { length: 20 }).default('pvp').notNull(), // pvp, bot
    timeControl: varchar('time_control', { length: 20 }).notNull(), // bullet, blitz, rapid, classical
    initialFen: text('initial_fen').default('startpos'),
    result: varchar('result', { length: 20 }), // white_wins, black_wins, draw
    resultReason: varchar('result_reason', { length: 50 }), // checkmate, resign, timeout, stalemate...
    status: varchar("status", { length: 20 }).default("active").notNull(), // active, completed, aborted
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at')
})
