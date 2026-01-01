// src/lib/socket-client.ts
'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth-token';

let socket: Socket | null = null;
let isConnecting = false;

// Use HTTP URL - Socket.IO will automatically upgrade to WebSocket (wss:// for https://)
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || 'http://localhost:5000';

console.log('Socket.IO URL:', BASE_URL);

// Server time offset for clock synchronization
let serverTimeOffset = 0;
let offsetSampleCount = 0;
const MAX_OFFSET_SAMPLES = 10;

export function getServerTimeOffset(): number {
    return serverTimeOffset;
}

export function setServerTimeOffset(offset: number): void {
    serverTimeOffset = offset;
}

// Get synchronized "server time" from client perspective
export function getServerTime(): number {
    return Date.now() + serverTimeOffset;
}

// Calculate time offset with better accuracy
function updateServerTimeOffset(serverTime: number): void {
    const clientNow = Date.now();
    const newOffset = serverTime - clientNow;

    // Use faster convergence for initial samples, then stabilize
    if (offsetSampleCount < MAX_OFFSET_SAMPLES) {
        // Simple average for first few samples
        serverTimeOffset = (serverTimeOffset * offsetSampleCount + newOffset) / (offsetSampleCount + 1);
        offsetSampleCount++;
    } else {
        // After initial samples, use EMA with stronger weighting toward stability
        // but still allow drift correction
        const weight = 0.1; // 10% weight to new sample
        serverTimeOffset = serverTimeOffset * (1 - weight) + newOffset * weight;
    }
}

/**
 * Reconnect the socket with updated authentication.
 * Call this after login/logout to ensure socket has correct auth token.
 */
export function reconnectSocketWithAuth(): void {
    if (!socket) {
        // Socket not initialized yet, will be created with token when getSocketClient() is called
        return;
    }

    const token = getAccessToken() ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
    console.log('🔄 Reconnecting socket with auth token:', token ? 'present' : 'none');

    // Update auth and force reconnect
    socket.auth = token ? { token: `Bearer ${token}` } : {};

    // Disconnect and reconnect with new auth
    if (socket.connected) {
        socket.disconnect();
    }
    socket.connect();
}

/**
 * Disconnect and clean up the socket.
 * Call this on logout.
 */
export function disconnectSocket(): void {
    if (socket) {
        console.log('🔌 Disconnecting socket');
        socket.disconnect();
        socket = null;
    }
}

export function getSocketClient(): Socket {
    if (!socket) {
        const initialAuthToken = getAccessToken() ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
        socket = io(BASE_URL, {
            withCredentials: true,
            // Allow both polling and websocket - Socket.IO will upgrade automatically
            transports: ['polling', 'websocket'],
            auth: initialAuthToken ? { token: `Bearer ${initialAuthToken}` } : undefined,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity
        });

        // Ensure auth is refreshed before reconnect attempts
        socket.on('reconnect_attempt', () => {
            const t = getAccessToken() ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
            socket!.auth = t ? { token: `Bearer ${t}` } : {};
        });

        // Log reconnection events
        socket.on('disconnect', (reason) => {
            console.warn('⚠️ WebSocket disconnected:', reason);
        });

        socket.on('connect', () => {
            console.log('✅ WebSocket connected:', socket!.id);
            // Reset offset samples on reconnect for fresh calibration
            offsetSampleCount = 0;
            // Request time sync from server
            socket!.emit('time:sync', { clientTime: Date.now() });
        });

        socket.on('reconnect', () => {
            console.log('✅ WebSocket reconnected:', socket!.id);
            // Reset offset samples on reconnect
            offsetSampleCount = 0;
            // Request time sync
            socket!.emit('time:sync', { clientTime: Date.now() });
        });

        // Handle time sync response for accurate initial offset
        socket.on('time:sync', (payload: { serverTime: number; clientTime: number }) => {
            const clientNow = Date.now();
            // Calculate round-trip time
            const rtt = clientNow - payload.clientTime;
            // Estimate one-way latency
            const latency = rtt / 2;
            // Server time adjusted for latency
            const adjustedServerTime = payload.serverTime + latency;
            updateServerTimeOffset(adjustedServerTime);
            console.log(`⏱️ Time sync: offset=${serverTimeOffset}ms, RTT=${rtt}ms`);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error);
        });

        // Sync server time on any event that includes serverTime
        socket.onAny((event, payload) => {
            if (payload && typeof payload === 'object' && 'serverTime' in payload) {
                updateServerTimeOffset(payload.serverTime);
            }
        });
    }
    return socket;
}

/**
 * Check if socket is currently connected
 */
export function isSocketConnected(): boolean {
    return socket?.connected ?? false;
}

/**
 * Wait for socket to be connected. Useful when you need to ensure connection before emitting.
 * @param timeoutMs Maximum time to wait (default 5000ms)
 * @returns Promise that resolves when connected or rejects on timeout
 */
export function waitForConnection(timeoutMs = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
        const sock = getSocketClient();

        if (sock.connected) {
            resolve();
            return;
        }

        const timeout = setTimeout(() => {
            sock.off('connect', onConnect);
            reject(new Error('Socket connection timeout'));
        }, timeoutMs);

        const onConnect = () => {
            clearTimeout(timeout);
            resolve();
        };

        sock.once('connect', onConnect);
    });
}