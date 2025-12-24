import { verifyAccessToken } from "utils/jwt";

export function socketAuthHandler(socket: any, next: (err?: any) => void) {

    try {
        let token: string | undefined;
        const auth = socket.handshake.auth as Record<string, any> | undefined;
        if (auth && typeof auth.token === 'string') token = auth.token;


        if (!token) {
            const h = socket.handshake.headers as Record<string, any> | undefined;
            if (h) token = (h.authorization || h.Authorization) as string | undefined;
        }

        if (token && token.startsWith('Bearer ')) token = token.slice(7);

        if (!token) {
            console.log(`❌ No auth token provided for socket ${socket.id}`);
            socket.emit('error', 'No auth token');
            socket.disconnect(true);
            return;
        }

        const payload = verifyAccessToken(token);
        socket.data.userId = payload.userId;
    } catch (err) {
        console.log(`❌ Socket auth failed for ${socket.id}:`, err instanceof Error ? err.message : err);
        socket.emit('error', 'Unauthorized');
        socket.disconnect(true);
        return;
    }
}