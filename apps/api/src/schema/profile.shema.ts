import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const profiles = pgTable('profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    bio: text('bio'),
    country: varchar('country', { length: 2 }),
    isOnline: boolean('is_online').default(false),
    preferences: jsonb('preferences').$type<{
        voiceEnabled: boolean;
        soundEnabled: boolean;
    }>(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});