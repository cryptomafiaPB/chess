'use client';

import { useQuery } from '@tanstack/react-query';
import { gameApi, type GameHistoryResponse } from '../api';

/**
 * Hook to fetch user's game history with pagination
 */
export function useGameHistory(limit: number = 20, offset: number = 0) {
    return useQuery<GameHistoryResponse>({
        queryKey: ['game-history', limit, offset],
        queryFn: () => gameApi.getGameHistory(limit, offset),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
