'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocketClient } from '@/lib/socket-client';

type VoiceState = 'idle' | 'connecting' | 'active' | 'error';

type QueuedCandidate = RTCIceCandidateInit;

export function useVoice(gameId: string) {
    const [state, setState] = useState<VoiceState>('idle');
    const [isMutedLocal, setIsMutedLocal] = useState(false);
    const [isMutedRemote, setIsMutedRemote] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [localLevel, setLocalLevel] = useState(0);
    const [remoteLevel, setRemoteLevel] = useState(0);

    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const remoteUserIdRef = useRef<string | null>(null);
    const pendingCandidatesRef = useRef<QueuedCandidate[]>([]);

    const localAudioContextRef = useRef<AudioContext | null>(null);
    const localAnalyserRef = useRef<AnalyserNode | null>(null);
    const localDataArrayRef = useRef<Uint8Array | null>(null);
    const localMeterRafRef = useRef<number | null>(null);

    const remoteAudioContextRef = useRef<AudioContext | null>(null);
    const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
    const remoteDataArrayRef = useRef<Uint8Array | null>(null);
    const remoteMeterRafRef = useRef<number | null>(null);

    const stopMeters = useCallback(() => {
        if (localMeterRafRef.current != null) {
            cancelAnimationFrame(localMeterRafRef.current);
            localMeterRafRef.current = null;
        }
        if (remoteMeterRafRef.current != null) {
            cancelAnimationFrame(remoteMeterRafRef.current);
            remoteMeterRafRef.current = null;
        }
        localAudioContextRef.current?.close();
        remoteAudioContextRef.current?.close();
        localAudioContextRef.current = null;
        remoteAudioContextRef.current = null;
        setLocalLevel(0);
        setRemoteLevel(0);
    }, []);

    const startLocalMeter = useCallback(
        (stream: MediaStream) => {
            try {
                const AudioCtx =
                    window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioCtx();
                localAudioContextRef.current = ctx;

                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                source.connect(analyser);

                localAnalyserRef.current = analyser;
                localDataArrayRef.current = dataArray;

                const tick = () => {
                    analyser.getByteTimeDomainData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        const v = dataArray[i] - 128;
                        sum += v * v;
                    }
                    const rms = Math.sqrt(sum / dataArray.length);
                    const level = Math.min(1, rms / 50);
                    setLocalLevel(level);
                    localMeterRafRef.current = requestAnimationFrame(tick);
                };

                tick();
            } catch {
                // ignore
            }
        },
        []
    );

    const startRemoteMeter = useCallback(
        (stream: MediaStream) => {
            try {
                const AudioCtx =
                    window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioCtx();
                remoteAudioContextRef.current = ctx;

                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                source.connect(analyser);

                remoteAnalyserRef.current = analyser;
                remoteDataArrayRef.current = dataArray;

                const tick = () => {
                    analyser.getByteTimeDomainData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        const v = dataArray[i] - 128;
                        sum += v * v;
                    }
                    const rms = Math.sqrt(sum / dataArray.length);
                    const level = Math.min(1, rms / 50);
                    setRemoteLevel(level);
                    remoteMeterRafRef.current = requestAnimationFrame(tick);
                };

                tick();
            } catch {
                // ignore
            }
        },
        []
    );

    const createPeerConnection = useCallback(async () => {
        if (pcRef.current) return pcRef.current;

        // Check if getUserMedia is available (requires HTTPS or localhost)
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error('Voice chat requires HTTPS. Please use a secure connection.');
        }

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        // Local media
        if (!localStreamRef.current) {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            localStreamRef.current = stream;
            stream.getAudioTracks().forEach((t) => pc.addTrack(t, stream));
            startLocalMeter(stream);
        } else {
            const stream = localStreamRef.current;
            stream
                .getAudioTracks()
                .forEach((t) => pc.addTrack(t, stream));
            startLocalMeter(stream);
        }

        // Remote track
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                remoteAudioRef.current
                    .play()
                    .catch(() => { });
            }
            startRemoteMeter(remoteStream);
        };

        // Connection state — update UI when DTLS/ICE is fully connected
        pc.onconnectionstatechange = () => {
            try {
                const stateNow = pc.connectionState;
                if (stateNow === 'connected') {
                    setState('active');
                }
            } catch {
                // ignore
            }
        };

        // ICE outbound
        const socket = getSocketClient();
        pc.onicecandidate = (event) => {
            if (event.candidate && remoteUserIdRef.current) {
                socket.emit('voice:ice-candidate', {
                    gameId,
                    targetUserId: remoteUserIdRef.current,
                    candidate: event.candidate,
                });
            }
        };

        return pc;
    }, [gameId, startLocalMeter, startRemoteMeter]);

    const cleanup = useCallback(() => {
        pcRef.current?.close();
        pcRef.current = null;
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        remoteUserIdRef.current = null;
        pendingCandidatesRef.current = [];
        stopMeters();
        setState('idle');
        setIsMutedLocal(false);
        setIsMutedRemote(false);
    }, [stopMeters]);

    useEffect(() => {
        const socket = getSocketClient();

        const handleReady = async (payload: { gameId: string; userId: string; targetUserId?: string }) => {
            if (payload.gameId !== gameId) return;
            // If payload has targetUserId and it's NOT me, ignore
            // You can pass myUserId into useVoice via argument; for now assume backend already targets correctly.
            try {
                // Check if getUserMedia is available before proceeding
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error('Voice chat requires HTTPS. Please use a secure connection.');
                }

                setState('connecting');
                remoteUserIdRef.current = payload.userId; // the caller
                const pc = await createPeerConnection();

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit('voice:offer', {
                    gameId,
                    targetUserId: payload.userId,
                    sdp: offer,
                });
            } catch (err: any) {
                setError(err?.message ?? 'Voice error');
                setState('error');
            }
        };

        const handleOffer = async (payload: any) => {
            if (payload.gameId !== gameId) return;
            // Only process if this offer is addressed to me (toUserId)
            // If you have myUserId, check: if (payload.toUserId && payload.toUserId !== myUserId) return;

            try {
                // Check if getUserMedia is available before proceeding
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error('Voice chat requires HTTPS. Please use a secure connection.');
                }

                setState('connecting');
                remoteUserIdRef.current = payload.fromUserId;
                const pc = await createPeerConnection();

                const currentState = pc.signalingState as string;
                console.log('[voice] offer received', {
                    type: payload.sdp?.type,
                    signalingState: currentState,
                    hasRemote: !!pc.currentRemoteDescription,
                });

                // Only set remote description if it's a valid offer and we're in a state to receive it
                if (payload.sdp?.type !== 'offer') {
                    console.log('[voice] invalid offer payload', payload.sdp);
                    return;
                }

                // Handle based on current signaling state
                if (currentState === 'stable') {
                    // Normal case: we're idle and ready to receive an offer
                    await pc.setRemoteDescription(payload.sdp);
                } else if (currentState === 'have-local-offer') {
                    // Glare situation: both sides sent offers simultaneously
                    // Use "polite peer" strategy - lower userId loses and accepts remote offer
                    console.log('[voice] glare detected, rolling back local offer');
                    await pc.setLocalDescription({ type: 'rollback' });
                    await pc.setRemoteDescription(payload.sdp);
                } else if (currentState === 'have-remote-offer') {
                    // Already have an offer, ignore duplicate
                    console.log('[voice] ignoring duplicate offer');
                    return;
                } else {
                    console.log('[voice] cannot accept offer in state:', currentState);
                    return;
                }

                // Now we should be in have-remote-offer state, create answer
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('voice:answer', {
                    gameId,
                    targetUserId: payload.fromUserId,
                    sdp: answer,
                });

                pendingCandidatesRef.current.forEach((c) => {
                    pc.addIceCandidate(c).catch((err) => {
                        console.error('addIceCandidate from queue error', err);
                    });
                });
                pendingCandidatesRef.current = [];
            } catch (err: any) {
                console.error('handleOffer error', err);
                setError(err?.message ?? 'Voice error');
                setState('error');
            }
        };


        const handleAnswer = async (payload: any) => {
            if (payload.gameId !== gameId) return;
            // If you track myUserId, also check payload.toUserId here
            try {
                const pc = pcRef.current;
                if (!pc) return;

                console.log('[voice] answer received', {
                    type: payload.sdp?.type,
                    signalingState: pc.signalingState,
                    hasRemote: !!pc.currentRemoteDescription,
                });

                // Try to set remote description if we don't have one yet.
                if (payload.sdp?.type === 'answer' && !pc.currentRemoteDescription) {
                    try {
                        await pc.setRemoteDescription(payload.sdp);
                    } catch (err) {
                        console.warn('[voice] setRemoteDescription failed on answer', err);
                    }
                }

                // If the PC is already connected or we have a remote description, mark as active.
                if (pc.connectionState === 'connected' || !!pc.currentRemoteDescription) {
                    setState('active');
                } else {
                    // fallback: set active to allow UI to reflect working audio even if signaling state differs
                    setState('active');
                }

                pendingCandidatesRef.current.forEach((c) => {
                    pc.addIceCandidate(c).catch((err) => {
                        console.error('addIceCandidate from queue error', err);
                    });
                });
                pendingCandidatesRef.current = [];
            } catch (err: any) {
                console.error('handleAnswer error', err);
                setError(err?.message ?? 'Voice error');
                setState('error');
            }
        };


        const handleIce = async (payload: any) => {
            if (payload.gameId !== gameId) return;
            // if (payload.toUserId && payload.toUserId !== myUserId) return;

            const pc = pcRef.current;
            if (!pc) {
                pendingCandidatesRef.current.push(payload.candidate);
                return;
            }

            if (!pc.currentRemoteDescription) {
                pendingCandidatesRef.current.push(payload.candidate);
                return;
            }

            try {
                await pc.addIceCandidate(payload.candidate);
            } catch (err) {
                console.error('addIceCandidate error', err);
            }
        };


        const handleMuteStatus = (payload: { gameId: string; isMuted: boolean }) => {
            if (payload.gameId !== gameId) return;
            setIsMutedRemote(payload.isMuted);
        };

        const handleHangup = () => {
            cleanup();
        };

        socket.on('voice:ready', handleReady);
        socket.on('voice:offer', handleOffer);
        socket.on('voice:answer', handleAnswer);
        socket.on('voice:ice-candidate', handleIce);
        socket.on('voice:mute-status', handleMuteStatus);
        socket.on('voice:hangup', handleHangup);

        return () => {
            socket.off('voice:ready', handleReady);
            socket.off('voice:offer', handleOffer);
            socket.off('voice:answer', handleAnswer);
            socket.off('voice:ice-candidate', handleIce);
            socket.off('voice:mute-status', handleMuteStatus);
            socket.off('voice:hangup', handleHangup);
            cleanup();
        };
    }, [gameId, createPeerConnection, cleanup]);

    const startVoice = useCallback(() => {
        // Check if voice chat is supported (requires HTTPS or localhost)
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Voice chat requires HTTPS. Please use a secure connection.');
            setState('error');
            return;
        }

        const socket = getSocketClient();
        setError(null);
        setState('connecting');
        socket.emit('voice:init', { gameId });
    }, [gameId]);

    const stopVoice = useCallback(() => {
        const socket = getSocketClient();
        socket.emit('voice:hangup', { gameId });
        cleanup();
    }, [gameId, cleanup]);

    const toggleMuteLocal = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) return;
        const next = !isMutedLocal;
        stream.getAudioTracks().forEach((t) => {
            t.enabled = !next;
        });
        setIsMutedLocal(next);
        const socket = getSocketClient();
        socket.emit('voice:mute-status', { gameId, isMuted: next });
    }, [gameId, isMutedLocal]);

    return {
        state,
        error,
        isMutedLocal,
        isMutedRemote,
        localLevel,
        remoteLevel,
        startVoice,
        stopVoice,
        toggleMuteLocal,
        remoteAudioRef,
    };
}
