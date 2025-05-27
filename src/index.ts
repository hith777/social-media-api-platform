import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { env } from './config/env';
import logger from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { securityConfig, corsOptions } from './config/security';
import { compressionMiddleware } from './middleware/compression';
import { initializeWebSocket } from './config/websocket';
import healthRouter from './routes/health';
import docsRouter from './routes/docs';
import userRoutes from './routes/userRoutes';
import contentRoutes from './routes/contentRoutes';
import commentRoutes from './routes/commentRoutes';
import socialRoutes from './routes/socialRoutes';
import notificationRoutes from './routes/notificationRoutes';
import searchRoutes from './routes/searchRoutes';

const app = express();
const httpServer = createServer(app);
const PORT = env.PORT;

// Security middleware
app.use(securityConfig);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware (optimized for API responses)
app.use(compressionMiddleware);

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Rate limiting middleware
app.use(apiLimiter);

// Basic route
app.get('/', (_req, res) => {
  res.json({
    message: 'Social Media API',
    version: '1.0.0',
    status: 'running',
  });
});

// Health check routes
app.use('/health', healthRouter);

// API documentation
app.use('/api-docs', docsRouter);

// API routes
app.use('/api/users', userRoutes);
app.use('/api/posts', contentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize WebSocket server
const io = initializeWebSocket(httpServer);
(global as any).io = io; // Make io available globally for notification emission

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${env.NODE_ENV} mode`);
  logger.info(`WebSocket server initialized on /socket.io`);
});

export default app;

