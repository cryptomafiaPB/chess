'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

export type SoundType =
    | 'move'
    | 'capture'
    | 'check'
    | 'checkmate'
    | 'castle'
    | 'promote'
    | 'illegal'
    | 'gameStart'
    | 'gameEnd'
    | 'lowTime'
    | 'draw'
    | 'notify';

// Sound synthesis using Web Audio API
class SoundSynthesizer {
    private audioContext: AudioContext | null = null;

    private getContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }
        return this.audioContext;
    }

    // Generate different sounds using Web Audio API
    synthesize(type: SoundType, volume: number): void {
        const ctx = this.getContext();
        const now = ctx.currentTime;

        switch (type) {
            case 'move':
                this.playTone(ctx, 440, 0.08, volume * 0.4, 'sine', now);
                break;
            case 'capture':
                this.playTone(ctx, 220, 0.05, volume * 0.5, 'sawtooth', now);
                this.playTone(ctx, 330, 0.08, volume * 0.4, 'sine', now + 0.02);
                break;
            case 'check':
                this.playTone(ctx, 880, 0.1, volume * 0.5, 'sine', now);
                this.playTone(ctx, 660, 0.1, volume * 0.4, 'sine', now + 0.1);
                break;
            case 'checkmate':
                this.playTone(ctx, 220, 0.15, volume * 0.6, 'sine', now);
                this.playTone(ctx, 165, 0.15, volume * 0.5, 'sine', now + 0.15);
                this.playTone(ctx, 110, 0.3, volume * 0.4, 'sine', now + 0.3);
                break;
            case 'castle':
                this.playTone(ctx, 330, 0.06, volume * 0.4, 'sine', now);
                this.playTone(ctx, 440, 0.06, volume * 0.4, 'sine', now + 0.06);
                break;
            case 'promote':
                this.playTone(ctx, 440, 0.08, volume * 0.4, 'sine', now);
                this.playTone(ctx, 550, 0.08, volume * 0.4, 'sine', now + 0.08);
                this.playTone(ctx, 660, 0.12, volume * 0.5, 'sine', now + 0.16);
                break;
            case 'illegal':
                this.playTone(ctx, 200, 0.15, volume * 0.3, 'sawtooth', now);
                break;
            case 'gameStart':
                this.playTone(ctx, 330, 0.1, volume * 0.4, 'sine', now);
                this.playTone(ctx, 440, 0.1, volume * 0.4, 'sine', now + 0.1);
                this.playTone(ctx, 550, 0.15, volume * 0.5, 'sine', now + 0.2);
                break;
            case 'gameEnd':
                this.playTone(ctx, 550, 0.15, volume * 0.4, 'sine', now);
                this.playTone(ctx, 440, 0.15, volume * 0.4, 'sine', now + 0.15);
                this.playTone(ctx, 330, 0.2, volume * 0.5, 'sine', now + 0.3);
                break;
            case 'lowTime':
                this.playTone(ctx, 1000, 0.08, volume * 0.3, 'sine', now);
                break;
            case 'draw':
                this.playTone(ctx, 440, 0.15, volume * 0.4, 'sine', now);
                this.playTone(ctx, 440, 0.2, volume * 0.3, 'sine', now + 0.2);
                break;
            case 'notify':
                this.playTone(ctx, 880, 0.08, volume * 0.3, 'sine', now);
                this.playTone(ctx, 1100, 0.1, volume * 0.4, 'sine', now + 0.1);
                break;
        }
    }

    private playTone(
        ctx: AudioContext,
        frequency: number,
        duration: number,
        volume: number,
        type: OscillatorType,
        startTime: number
    ): void {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.1);
    }
}

class SoundManager {
    private synthesizer: SoundSynthesizer;
    private enabled: boolean = true;
    private volume: number = 0.7;

    constructor() {
        this.synthesizer = new SoundSynthesizer();

        // Load stored preferences
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('chess-sounds-enabled');
            this.enabled = stored === null ? true : stored === 'true';

            const storedVolume = localStorage.getItem('chess-sounds-volume');
            this.volume = storedVolume ? parseFloat(storedVolume) : 0.7;
        }
    }

    play(type: SoundType): void {
        if (!this.enabled || typeof window === 'undefined') return;

        try {
            this.synthesizer.synthesize(type, this.volume);
        } catch {
            // Ignore errors (e.g., AudioContext not allowed yet)
        }
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (typeof window !== 'undefined') {
            localStorage.setItem('chess-sounds-enabled', String(enabled));
        }
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        if (typeof window !== 'undefined') {
            localStorage.setItem('chess-sounds-volume', String(this.volume));
        }
    }

    getVolume(): number {
        return this.volume;
    }
}

// Singleton instance
let soundManager: SoundManager | null = null;

function getSoundManager(): SoundManager {
    if (!soundManager) {
        soundManager = new SoundManager();
    }
    return soundManager;
}

export function useSound() {
    const [enabled, setEnabledState] = useState(true);
    const [volume, setVolumeState] = useState(0.7);
    const managerRef = useRef<SoundManager | null>(null);

    useEffect(() => {
        managerRef.current = getSoundManager();
        setEnabledState(managerRef.current.isEnabled());
        setVolumeState(managerRef.current.getVolume());
    }, []);

    const play = useCallback((type: SoundType) => {
        managerRef.current?.play(type);
    }, []);

    const setEnabled = useCallback((enabled: boolean) => {
        managerRef.current?.setEnabled(enabled);
        setEnabledState(enabled);
    }, []);

    const setVolume = useCallback((volume: number) => {
        managerRef.current?.setVolume(volume);
        setVolumeState(volume);
    }, []);

    const toggle = useCallback(() => {
        const newEnabled = !enabled;
        setEnabled(newEnabled);
        return newEnabled;
    }, [enabled, setEnabled]);

    return {
        play,
        enabled,
        volume,
        setEnabled,
        setVolume,
        toggle,
    };
}

// Hook for game-specific sound effects
export function useGameSounds() {
    const { play, enabled } = useSound();

    const playMove = useCallback((moveInfo?: {
        isCapture?: boolean;
        isCheck?: boolean;
        isCheckmate?: boolean;
        isCastle?: boolean;
        isPromotion?: boolean;
    }) => {
        if (!enabled) return;

        if (moveInfo?.isCheckmate) {
            play('checkmate');
        } else if (moveInfo?.isCheck) {
            play('check');
        } else if (moveInfo?.isCapture) {
            play('capture');
        } else if (moveInfo?.isCastle) {
            play('castle');
        } else if (moveInfo?.isPromotion) {
            play('promote');
        } else {
            play('move');
        }
    }, [play, enabled]);

    const playIllegal = useCallback(() => {
        play('illegal');
    }, [play]);

    const playGameStart = useCallback(() => {
        play('gameStart');
    }, [play]);

    const playGameEnd = useCallback(() => {
        play('gameEnd');
    }, [play]);

    const playLowTime = useCallback(() => {
        play('lowTime');
    }, [play]);

    const playDraw = useCallback(() => {
        play('draw');
    }, [play]);

    const playNotify = useCallback(() => {
        play('notify');
    }, [play]);

    return {
        playMove,
        playIllegal,
        playGameStart,
        playGameEnd,
        playLowTime,
        playDraw,
        playNotify,
        enabled,
    };
}
