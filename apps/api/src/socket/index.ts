import { Server } from 'socket.io';
import { gameHandler } from './handlers/game.handler';
// import { chatHandler } from './handlers/chat.handler';
// import { voiceHandler } from './handlers/voice.handler';
import { matchmakingHandler } from './handlers/matchmaking.handler';

export const initializeSocket = (io: Server) => {
    io.on('connection', (socket) => {
        // Here you should parse JWT from handshake.auth or headers and set socket.data.userId. [web:56][web:40]

        console.log(`✅ Client connected: ${socket.id}`);

        gameHandler(io, socket);
        // chatHandler(io, socket);
        // voiceHandler(io, socket);
        matchmakingHandler(io, socket);

        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
};
