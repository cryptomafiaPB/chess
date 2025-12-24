// src/lib/socket-client.ts
'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth-token';

let socket: Socket | null = null;

const BASE_WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:5000'; // e.g. ws://localhost:5000

console.log('WebSocket URL:', BASE_WS_URL);

export function getSocketClient(): Socket {
    if (!socket) {
        // read token and include in initial handshake
        const token = getAccessToken() ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

        const initialAuthToken = getAccessToken() ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
        socket = io(BASE_WS_URL, {
            withCredentials: true,
            transports: ['websocket'],
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
    }
    return socket;
}