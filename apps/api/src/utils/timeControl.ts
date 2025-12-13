// backend/src/services/timeControl.ts
export type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical';

export interface TimeControlConfig {
    initialMs: number;
    incrementMs: number;
}

export const TIME_CONTROLS: Record<TimeControl, TimeControlConfig> = {
    bullet: { initialMs: 60_000, incrementMs: 0 },        // 1+0
    blitz: { initialMs: 180_000, incrementMs: 2_000 },    // 3+2
    rapid: { initialMs: 600_000, incrementMs: 5_000 },    // 10+5
    classical: { initialMs: 1_800_000, incrementMs: 0 }   // 30+0
};
