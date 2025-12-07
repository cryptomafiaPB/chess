import { Server } from 'socket.io';
// import { gameHandler } from './handlers/game.handler';
// import { chatHandler } from './handlers/chat.handler';
// import { voiceHandler } from './handlers/voice.handler';

export const initializeSocket = (io: Server) => {
    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // Register handlers
        // gameHandler(io, socket);
        // chatHandler(io, socket);
        // voiceHandler(io, socket);

        socket.on('disconnect', () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
};
