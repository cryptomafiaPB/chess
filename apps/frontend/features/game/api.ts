import { apiClient } from '@/lib/api-client';

export interface PlayerDetails {
    id: number;
    username: string;
    rating: number;
    avatarUrl?: string;
    country?: string;
}

export interface GameDetails {
    gameId: string;
    timeControl: string;
    mode: string;
    startedAt: string;
    whitePlayer: PlayerDetails;
    blackPlayer: PlayerDetails;
}

export const gameApi = {
    /**
     * Get static game details (player info, time control)
     * This data doesn't change during the game
     */
    getGameDetails: (gameId: string) =>
        apiClient.get<GameDetails>(`/api/v1/games/${gameId}`),

    /**
     * Get full game state including dynamic data
     */
    getGameState: (gameId: string) =>
        apiClient.get(`/api/v1/games/${gameId}/state`),
};
