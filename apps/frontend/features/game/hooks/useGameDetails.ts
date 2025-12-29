'use client';

import { useQuery } from '@tanstack/react-query';
import { gameApi, type GameDetails } from '../api';

/**
 * Hook to fetch static game details (player info, time control)
 * This data is fetched once via REST API and cached
 * It doesn't need to be updated via WebSocket since it doesn't change
 */
export function useGameDetails(gameId: string) {
    return useQuery<GameDetails>({
        queryKey: ['game-details', gameId],
        queryFn: () => gameApi.getGameDetails(gameId),
        staleTime: Infinity, // Static data doesn't change
        gcTime: 1000 * 60 * 30, // Cache for 30 minutes
        enabled: !!gameId,
    });
}
