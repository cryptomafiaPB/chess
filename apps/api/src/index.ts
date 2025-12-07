import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/env';
import cors from 'cors';
import { initializeSocket } from './socket/index';
import { redis } from 'db/redis';
import { db } from 'config/database';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.io
initializeSocket(io);

redis; // Ensure Redis client is initialized
db; // Ensure Database is initialized

// Start server
httpServer.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
});
