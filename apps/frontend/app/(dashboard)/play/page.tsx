'use client';

import { Button } from '@/components/ui/button';
import { TimeControl, useMatchmaking } from '@/features/game/hooks/useMatchMaking';
import { cn } from '@/lib/utils';

const TIME_CONTROLS: { id: TimeControl; label: string }[] = [
    { id: 'bullet', label: 'Bullet' },
    { id: 'blitz', label: 'Blitz' },
    { id: 'rapid', label: 'Rapid' },
    { id: 'classical', label: 'Classical' },
];

export default function PlayPage() {
    const {
        isQueueing,
        timeControl,
        error,
        joinQueue,
        leaveQueue,
        setTimeControl,
    } = useMatchmaking();

    return (
        <div className="flex h-full flex-col gap-6 p-4">
            <div>
                <h1 className="text-2xl font-semibold">Play</h1>
                <p className="text-sm text-muted-foreground">
                    Choose a time control and start a real-time game.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                {TIME_CONTROLS.map((tc) => (
                    <Button
                        key={tc.id}
                        type="button"
                        variant={timeControl === tc.id ? 'default' : 'outline'}
                        disabled={isQueueing}
                        className={cn(
                            'min-w-[90px]',
                            timeControl === tc.id && 'ring-2 ring-primary/40'
                        )}
                        onClick={() => setTimeControl(tc.id)}
                    >
                        {tc.label}
                    </Button>
                ))}
            </div>

            <div className="mt-2">
                {isQueueing ? (
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={leaveQueue}
                    >
                        Cancel search
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={() => joinQueue(timeControl)}
                    >
                        Play {TIME_CONTROLS.find((t) => t.id === timeControl)?.label}
                    </Button>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}
