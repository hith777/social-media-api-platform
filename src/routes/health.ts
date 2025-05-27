import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import prisma, { healthCheck as dbHealthCheck, getConnectionPoolStats } from '../config/database';
import { createClient } from 'redis';
import { env } from '../config/env';
import logger from '../config/logger';

const router = Router();

// Basic health check
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
    });
  })
);

// Detailed health check with service status
router.get(
  '/detailed',
  asyncHandler(async (_req: Request, res: Response) => {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // Check database connection with pool health
    try {
      const dbHealth = await dbHealthCheck();
      healthStatus.services.database = dbHealth.status === 'healthy' ? 'connected' : 'degraded';
      if (dbHealth.latency) {
        (healthStatus.services as any).databaseLatency = `${dbHealth.latency}ms`;
      }
      if (dbHealth.status === 'unhealthy') {
        healthStatus.status = 'degraded';
      }
    } catch (error) {
      healthStatus.services.database = 'disconnected';
      healthStatus.status = 'degraded';
      logger.error('Database health check failed:', error);
    }

    // Check Redis connection
    try {
      const redisClient = createClient({ url: env.REDIS_URL });
      await redisClient.connect();
      await redisClient.ping();
      await redisClient.quit();
      healthStatus.services.redis = 'connected';
    } catch (error) {
      healthStatus.services.redis = 'disconnected';
      healthStatus.status = 'degraded';
      logger.error('Redis health check failed:', error);
    }

    const statusCode = healthStatus.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  })
);

// Readiness check (for Kubernetes/Docker)
router.get(
  '/ready',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      // Check if database is ready
      await prisma.$queryRaw`SELECT 1`;
      
      // Check if Redis is ready
      const redisClient = createClient({ url: env.REDIS_URL });
      await redisClient.connect();
      await redisClient.ping();
      await redisClient.quit();

      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Readiness check failed:', error);
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
      });
    }
  })
);

// Liveness check (for Kubernetes/Docker)
router.get(
  '/live',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;

