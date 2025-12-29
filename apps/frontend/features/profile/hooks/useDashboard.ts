// features/profile/hooks/useDashboard.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api';

export function useDashboard() {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: () => profileApi.getDashboard(),
        staleTime: 60000, // 1 minute
        refetchOnWindowFocus: true,
    });
}
