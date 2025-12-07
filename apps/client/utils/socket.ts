import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocket = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!socket) {
        socket = io("http://localhost:8000"); // Replace with your server URL
    }
    return socket;
}

export default getSocket;