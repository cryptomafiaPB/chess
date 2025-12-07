// Enum for player color
export enum Color {
    WHITE = 'w',
    BLACK = 'b',
}

export interface JoinData {
    gameId: string;
    playerName: string;
    // add playerId, rating, etc.
}

export interface MovePayload {
    gameId: string;   // ID of the game
    from: string;       // e.g., "e2"
    to: string;         // e.g., "e4"
    promotion?: string; // e.g., "q" for queen promotion
}