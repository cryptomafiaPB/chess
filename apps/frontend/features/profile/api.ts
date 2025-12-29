// features/profile/api.ts
import { apiClient } from '@/lib/api-client';

export interface DashboardData {
    me: {
        id: number;
        username: string;
        email: string;
        avatarUrl?: string | null;
        createdAt: Date;
    };
    ratings: {
        bullet: RatingInfo;
        blitz: RatingInfo;
        rapid: RatingInfo;
        classical: RatingInfo;
    };
    summary: {
        totalGames: number;
        wins: number;
        losses: number;
        draws: number;
        winRate: number;
    };
    recentGames: RecentGame[];
}

export interface RatingInfo {
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
}

export interface RecentGame {
    gameId: string;
    opponentName: string;
    result: 'win' | 'loss' | 'draw';
    timeControl: string;
    endedAt: Date | null;
}

export interface UserProfile {
    id: number;
    username: string;
    avatar_url?: string | null;
    createdAt: string;
    email?: string;
    profile: {
        bio?: string | null;
        country?: string | null;
        isOnline?: boolean;
    };
    ratings: Array<{
        timeControl: string;
        rating: number;
        gamesPlayed: number;
        wins: number;
        losses: number;
        draws: number;
    }>;
    stats: {
        totalGames: number;
        totalWins: number;
        totalLosses: number;
        totalDraws: number;
        longestWinStreak: number;
        currentWinStreak: number;
    };
}

export interface LeaderboardEntry {
    userId: number;
    username: string;
    avatar: string | null;
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
}

export interface SearchResult {
    id: number;
    username: string;
    avatar: string | null;
    isOnline: boolean;
}

export const profileApi = {
    async getDashboard(): Promise<DashboardData> {
        const response = await apiClient.get<{ success: boolean; data: DashboardData }>(
            '/api/v1/profile/dashboard'
        );
        console.log('Dashboard response data:', response.data);
        return response.data;
    },

    async getProfile(userId: string): Promise<UserProfile> {
        const response = await apiClient.get<{ success: boolean; data: UserProfile }>(
            `/api/v1/profile/${userId}`
        );
        return response.data;
    },

    async getStats(userId: string) {
        const response = await apiClient.get<{ success: boolean; data: any }>(
            `/api/v1/profile/${userId}/stats`
        );
        return response.data;
    },

    async updateProfile(data: {
        username?: string;
        avatar?: string;
        bio?: string;
        country?: string;
    }) {
        const response = await apiClient.patch<{ success: boolean; data: any }>(
            '/api/v1/profile/me',
            data
        );
        return response.data;
    },

    async searchUsers(query: string, limit: number = 10): Promise<SearchResult[]> {
        const response = await apiClient.get<{ success: boolean; data: SearchResult[] }>(
            `/api/v1/profile/search?q=${encodeURIComponent(query)}&limit=${limit}`
        );
        return response.data;
    },

    async getLeaderboard(timeControl: string, limit: number = 50): Promise<LeaderboardEntry[]> {
        const response = await apiClient.get<{ success: boolean; data: LeaderboardEntry[] }>(
            `/api/v1/profile/leaderboard?timeControl=${timeControl}&limit=${limit}`
        );
        return response.data;
    },
};