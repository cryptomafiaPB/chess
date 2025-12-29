export type RatingInfo = {
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
};

export type DashboardRecentGame = {
    gameId: string;
    opponentName: string;
    result: 'win' | 'loss' | 'draw' | 'aborted';
    timeControl: string; // e.g. "blitz-3+2" or however you store it
    endedAt: string; // ISO
};

export type DashboardSummary = {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number; // 0-100
};

export type DashboardMe = {
    id: number;
    username: string;
    email?: string;
    avatarUrl?: string | null;
    createdAt?: string;
};

export type DashboardResponse = {
    success: boolean;
    data: {
        me: DashboardMe;
        ratings: {
            bullet: RatingInfo;
            blitz: RatingInfo;
            rapid: RatingInfo;
            classical: RatingInfo;
        };
        summary: DashboardSummary;
        recentGames: DashboardRecentGame[];
    };
};
