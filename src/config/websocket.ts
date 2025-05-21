import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import prisma from './database';
import logger from './logger';

// Store user socket connections: userId -> socketId[]
const userSockets = new Map<string, Set<string>>();

// Store socket to user mapping: socketId -> userId
const socketUsers = new Map<string, string>();

export function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
        return next(new Error('Authentication error: Invalid token'));
      }

      // Verify user exists and is active
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user info to socket
      (socket as any).userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // Store socket connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);
    socketUsers.set(socket.id, userId);

    logger.info(`User ${userId} connected via WebSocket (socket: ${socket.id})`);

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User ${userId} disconnected (socket: ${socket.id})`);

      // Remove socket from user's connections
      const userSocketSet = userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
        }
      }
      socketUsers.delete(socket.id);
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  return io;
}

/**
 * Emit notification to a specific user
 */
export function emitNotification(userId: string, notification: any): void {
  const io = (global as any).io as SocketIOServer | undefined;
  if (!io) {
    logger.warn('WebSocket server not initialized, cannot emit notification');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  logger.debug(`Notification emitted to user ${userId}: ${notification.type}`);
}

/**
 * Check if a user is connected via WebSocket
 */
export function isUserConnected(userId: string): boolean {
  return userSockets.has(userId) && userSockets.get(userId)!.size > 0;
}

/**
 * Get number of active connections for a user
 */
export function getUserConnectionCount(userId: string): number {
  return userSockets.get(userId)?.size || 0;
}

