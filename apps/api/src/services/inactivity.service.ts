// backend/src/services/inactivity.service.ts
import { Server } from 'socket.io';
import { redis } from '../db/redis';
import { gameService } from './game.service';
import { db } from '../config/database';
import { eq } from 'drizzle-orm';
import { games } from '../schema/game.schema';
import { ratingService } from './rating.service';

// 60 seconds inactivity timeout
const INACTIVITY_TIMEOUT_MS = 60 * 1000;
// Warning starts at 30 seconds remaining
const WARNING_THRESHOLD_MS = 30 * 1000;
// How often to broadcast countdown updates (every second)
const COUNTDOWN_INTERVAL_MS = 1000;

interface InactivityState {
    gameId: string;
    activeColor: 'white' | 'black';
    turnStartedAt: number;
}

class InactivityService {
    private activeTimers: Map<string, NodeJS.Timeout> = new Map();
    private warningTimers: Map<string, NodeJS.Timeout> = new Map();
    private countdownIntervals: Map<string, NodeJS.Timeout> = new Map();

    private inactivityKey(gameId: string) {
        return `inactivity:${gameId}`;
    }

    /**
     * Start tracking inactivity for a player's turn
     */
    async startInactivityTimer(gameId: string, activeColor: 'white' | 'black', io: Server) {
        // Clear any existing timers for this game
        this.clearTimers(gameId);

        const now = Date.now();

        // Store inactivity state in Redis
        await redis.hset(this.inactivityKey(gameId), {
            activeColor,
            turnStartedAt: now.toString()
        });
        await redis.expire(this.inactivityKey(gameId), 300); // 5 min expiry

        // Broadcast turn start with inactivity info
        io.to(`game:${gameId}`).emit('game:inactivity-start', {
            gameId,
            activeColor,
            turnStartedAt: now,
            timeoutAt: now + INACTIVITY_TIMEOUT_MS,
            warningAt: now + (INACTIVITY_TIMEOUT_MS - WARNING_THRESHOLD_MS),
            serverTime: now
        });

        // Set warning timer (fires at 30 seconds remaining)
        const warningDelay = INACTIVITY_TIMEOUT_MS - WARNING_THRESHOLD_MS;
        const warningTimer = setTimeout(async () => {
            await this.startWarningCountdown(gameId, activeColor, io);
        }, warningDelay);
        this.warningTimers.set(gameId, warningTimer);

        // Set timeout timer (fires at 60 seconds)
        const timeoutTimer = setTimeout(async () => {
            await this.handleInactivityTimeout(gameId, activeColor, io);
        }, INACTIVITY_TIMEOUT_MS);
        this.activeTimers.set(gameId, timeoutTimer);
    }

    /**
     * Start the warning countdown (last 30 seconds)
     */
    private async startWarningCountdown(gameId: string, activeColor: 'white' | 'black', io: Server) {
        let remainingSeconds = WARNING_THRESHOLD_MS / 1000;

        // Emit initial warning
        io.to(`game:${gameId}`).emit('game:inactivity-warning', {
            gameId,
            activeColor,
            remainingSeconds,
            serverTime: Date.now()
        });

        // Start countdown interval
        const interval = setInterval(() => {
            remainingSeconds--;

            if (remainingSeconds > 0) {
                io.to(`game:${gameId}`).emit('game:inactivity-warning', {
                    gameId,
                    activeColor,
                    remainingSeconds,
                    serverTime: Date.now()
                });
            } else {
                clearInterval(interval);
                this.countdownIntervals.delete(gameId);
            }
        }, COUNTDOWN_INTERVAL_MS);

        this.countdownIntervals.set(gameId, interval);
    }

    /**
     * Handle inactivity timeout - player loses by timeout/abandonment
     */
    private async handleInactivityTimeout(gameId: string, activeColor: 'white' | 'black', io: Server) {
        this.clearTimers(gameId);

        try {
            // Check if game is still active
            const gameRow = await gameService.getGameRow(gameId);
            if (gameRow.status !== 'active') {
                return; // Game already ended
            }

            // Determine result - the inactive player loses
            const result = activeColor === 'white' ? 'black_wins' : 'white_wins';
            const resultReason = 'inactivity';

            // Update database
            await db
                .update(games)
                .set({
                    status: 'completed',
                    result,
                    resultReason,
                    endedAt: new Date()
                })
                .where(eq(games.id, Number(gameId)));

            // Update Redis state
            const gameKey = `game:${gameId}`;
            await redis.hset(gameKey, {
                status: 'completed',
                result,
                resultReason
            });

            // Update ratings
            await ratingService.updateRatingsForGame(gameId);

            // Notify all clients
            io.to(`game:${gameId}`).emit('game:ended', {
                gameId,
                result,
                resultReason: 'inactivity',
                serverTime: Date.now()
            });

            // Clear inactivity state from Redis
            await redis.del(this.inactivityKey(gameId));

        } catch (error) {
            console.error('Error handling inactivity timeout:', error);
        }
    }

    /**
     * Cancel inactivity timer (called when a move is made or game ends)
     */
    async cancelInactivityTimer(gameId: string, io: Server) {
        this.clearTimers(gameId);

        // Notify clients that inactivity timer was cancelled
        io.to(`game:${gameId}`).emit('game:inactivity-cancelled', {
            gameId,
            serverTime: Date.now()
        });

        // Clear Redis state
        await redis.del(this.inactivityKey(gameId));
    }

    /**
     * Get current inactivity state for a game
     */
    async getInactivityState(gameId: string): Promise<InactivityState | null> {
        const key = this.inactivityKey(gameId);
        const [activeColor, turnStartedAt] = await redis.hmget(
            key,
            'activeColor',
            'turnStartedAt'
        );

        if (!activeColor || !turnStartedAt) {
            return null;
        }

        return {
            gameId,
            activeColor: activeColor as 'white' | 'black',
            turnStartedAt: Number(turnStartedAt)
        };
    }

    /**
     * Get remaining time before inactivity timeout
     */
    async getRemainingTime(gameId: string): Promise<{ remainingMs: number; activeColor: 'white' | 'black' } | null> {
        const state = await this.getInactivityState(gameId);
        if (!state) return null;

        const elapsed = Date.now() - state.turnStartedAt;
        const remainingMs = Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed);

        return {
            remainingMs,
            activeColor: state.activeColor
        };
    }

    /**
     * Clear all timers for a game
     */
    private clearTimers(gameId: string) {
        const activeTimer = this.activeTimers.get(gameId);
        if (activeTimer) {
            clearTimeout(activeTimer);
            this.activeTimers.delete(gameId);
        }

        const warningTimer = this.warningTimers.get(gameId);
        if (warningTimer) {
            clearTimeout(warningTimer);
            this.warningTimers.delete(gameId);
        }

        const countdownInterval = this.countdownIntervals.get(gameId);
        if (countdownInterval) {
            clearInterval(countdownInterval);
            this.countdownIntervals.delete(gameId);
        }
    }

    /**
     * Clean up all timers (for server shutdown)
     */
    clearAllTimers() {
        for (const [gameId] of this.activeTimers) {
            this.clearTimers(gameId);
        }
    }
}

export const inactivityService = new InactivityService();
