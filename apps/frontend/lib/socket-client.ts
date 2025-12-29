// src/lib/socket-client.ts
'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth-token';

let socket: Socket | null = null;

// Use HTTP URL - Socket.IO will automatically upgrade to WebSocket (wss:// for https://)
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || 'http://localhost:5000';

console.log('Socket.IO URL:', BASE_URL);

// Server time offset for clock synchronization
let serverTimeOffset = 0;

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
        });

        socket.on('reconnect', () => {
            console.log('✅ WebSocket reconnected:', socket!.id);
        });

        socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error);
        });

        // Sync server time on any event that includes serverTime
        socket.onAny((event, payload) => {
            if (payload && typeof payload === 'object' && 'serverTime' in payload) {
                const clientNow = Date.now();
                const newOffset = payload.serverTime - clientNow;
                // Use exponential moving average to smooth out network jitter
                serverTimeOffset = serverTimeOffset === 0
                    ? newOffset
                    : serverTimeOffset * 0.8 + newOffset * 0.2;
            }
        });
    }
    return socket;
}