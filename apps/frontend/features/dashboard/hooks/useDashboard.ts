'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api';

export function useDashboard() {
    return useQuery({
        queryKey: ['me', 'dashboard'],
        queryFn: getDashboard,
        staleTime: 15_000,
    });
}
