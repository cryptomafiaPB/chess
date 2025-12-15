// src/lib/socket-client.ts
'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth-token';

let socket: Socket | null = null;

const BASE_WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:5000'; // e.g. ws://localhost:5000

export function getSocketClient(): Socket {
    if (!socket) {
        // read token and include in initial handshake
        const token = getAccessToken() ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

        const initialAuthToken = getAccessToken() ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
        socket = io(BASE_WS_URL, {
            withCredentials: true,
            transports: ['websocket'],
            auth: initialAuthToken ? { token: `Bearer ${initialAuthToken}` } : undefined,
        });

        // Ensure auth is refreshed before reconnect attempts
        socket.on('reconnect_attempt', () => {
            const t = getAccessToken() ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
            socket!.auth = t ? { token: `Bearer ${t}` } : {};
        });
    }
    else {
        // update auth on reconnect if token changes
        socket.auth = () => {
            const token = getAccessToken();
            return token ? { token: `Bearer ${token}` } : {};
        };
    }
    return socket;
}
