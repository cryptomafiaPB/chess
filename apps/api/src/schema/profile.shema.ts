import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

// Define the preferences type separately for reuse
export type ProfilePreferences = {
    // Sound settings
    soundEnabled?: boolean;
    moveSound?: boolean;
    captureSound?: boolean;
    checkSound?: boolean;
    gameEndSound?: boolean;
    notificationSound?: boolean;
    soundVolume?: number; // 0-100
    // Voice settings
    voiceEnabled?: boolean;
    // Display settings
    boardTheme?: 'classic' | 'wood' | 'marble' | 'green' | 'blue';
    pieceSet?: 'standard' | 'neo' | 'alpha' | 'chess7';
    showCoordinates?: boolean;
    showLegalMoves?: boolean;
    showLastMove?: boolean;
    autoPromoteToQueen?: boolean;
    confirmMoves?: boolean;
    // Notification settings
    emailNotifications?: boolean;
    gameInviteNotifications?: boolean;
    friendRequestNotifications?: boolean;
    messageNotifications?: boolean;
};

// Default preferences
export const DEFAULT_PREFERENCES: ProfilePreferences = {
    soundEnabled: true,
    moveSound: true,
    captureSound: true,
    checkSound: true,
    gameEndSound: true,
    notificationSound: true,
    soundVolume: 80,
    voiceEnabled: true,
    boardTheme: 'classic',
    pieceSet: 'standard',
    showCoordinates: true,
    showLegalMoves: true,
    showLastMove: true,
    autoPromoteToQueen: false,
    confirmMoves: false,
    emailNotifications: true,
    gameInviteNotifications: true,
    friendRequestNotifications: true,
    messageNotifications: true,
};

export const profiles = pgTable('profiles', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    bio: text('bio'),
    country: varchar('country', { length: 2 }),
    isOnline: boolean('is_online').default(false),
    lastSeen: timestamp('last_seen'),
    preferences: jsonb('preferences').$type<ProfilePreferences>(),
    createdAt: timestamp('created_at').defaultNow().notNull()
});