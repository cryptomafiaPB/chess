import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(gameId: string): Socket | null {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        socketRef.current = io("http://localhost:4000", { auth: { gameId } });
        return () => {
            socketRef.current?.disconnect();
        };
    }, [gameId]);

    return socketRef.current;
}
