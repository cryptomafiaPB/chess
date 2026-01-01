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

export interface GameHistoryItem {
    id: number;
    playedAs: 'white' | 'black';
    opponent: {
        id: number;
        username: string;
        avatarUrl?: string;
    };
    timeControl: string;
    result: 'win' | 'loss' | 'draw' | null;
    resultReason: string | null;
    status: string;
    startedAt: string;
    endedAt: string | null;
}

export interface GameHistoryResponse {
    games: GameHistoryItem[];
    total: number;
    limit: number;
    offset: number;
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

    /**
     * Get user's game history
     */
    getGameHistory: (limit: number = 20, offset: number = 0) =>
        apiClient.get<GameHistoryResponse>(`/api/v1/games/history/me?limit=${limit}&offset=${offset}`),
};
