import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/env';
import cors from 'cors';
import { initializeSocket } from './socket/index';
import { redis } from 'db/redis';
import { db } from 'config/database';
import { errorHandler } from 'middleware/error.middleware';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './routes/auth.route';
import profileRoutes from './routes/profile.route';
import friendRoutes from './routes/friend.route';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/friends', friendRoutes);


// Error handler (must be last)
app.use(errorHandler);

// Initialize Socket.io
initializeSocket(io);
redis; // Ensure Redis client is initialized
db; // Ensure Database is initialized

// Start server
httpServer.listen(config.port, () => {
    console.log(`🚀 Server running on port ${config.port}`);
});
