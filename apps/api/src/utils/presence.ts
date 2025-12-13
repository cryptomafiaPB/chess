// backend/src/services/presence.ts

import type { TimeControl } from "./timeControl";


export function getDisconnectGraceMs(timeControl: TimeControl): number {
    switch (timeControl) {
        case 'bullet':
            return 15_000; // 15s
        case 'blitz':
            return 30_000; // 30s
        case 'rapid':
            return 60_000; // 60s
        case 'classical':
            return 120_000; // 2 min
        default:
            return 30_000;
    }
}
