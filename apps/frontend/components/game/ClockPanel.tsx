'use client';

import React from 'react';
import { useClockDisplay } from '@/features/game/hooks/useClockDisplay';

type Props = {
    clocks: { white: number; black: number } | null | undefined;
    fen: string | null | undefined;
    status: string | null | undefined;
    whiteLabel: React.ReactNode;
    blackLabel: React.ReactNode;
    presence: { white: string; black: string } | undefined;
};

export function ClockPanel({ clocks, fen, status, whiteLabel, blackLabel, presence }: Props) {
    const display = useClockDisplay(clocks ?? { white: 0, black: 0 }, fen ?? '', status ?? '');

    return (
        <div className="mb-2 flex w-full items-center justify-between text-xs text-muted-foreground">
            <div>
                White: {whiteLabel} ({display.whiteFormatted})
                <span className="ml-2 text-xs text-muted-foreground">({presence?.white ?? 'offline'})</span>
            </div>
            <div>
                Black: {blackLabel} ({display.blackFormatted})
                <span className="ml-2 text-xs text-muted-foreground">({presence?.black ?? 'offline'})</span>
            </div>
        </div>
    );
}
