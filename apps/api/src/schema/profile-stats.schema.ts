import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const profileStats = pgTable('profile_stats', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
    totalGames: integer('total_games').default(0).notNull(),
    totalWins: integer('total_wins').default(0).notNull(),
    totalLosses: integer('total_losses').default(0).notNull(),
    totalDraws: integer('total_draws').default(0).notNull(),
    longestWinStreak: integer('longest_win_streak').default(0).notNull(),
    currentWinStreak: integer('current_win_streak').default(0).notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
});