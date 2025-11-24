import { relations } from "drizzle-orm";
import { pgTable, serial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { games } from "./game.schema";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    hashed_password: varchar("hashed_password", { length: 255 }).notNull(),
    bio: text("bio"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
});


export const userRelations = relations(users, ({ many }) => ({
    games: many(games)
}));
