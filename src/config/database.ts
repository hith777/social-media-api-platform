import { PrismaClient, Prisma } from '@prisma/client';
import { env } from './env';
import logger from './logger';

/**
 * Build connection string with pool parameters
 * Prisma manages connection pooling internally, but we can configure it via DATABASE_URL
 * For PostgreSQL, Prisma uses a connection pool with these defaults:
 * - connection_limit: 10 (can be set via ?connection_limit=N)
 * - pool_timeout: 10 seconds
 * 
 * Note: For production, consider using a connection pooler like PgBouncer
 */
function buildConnectionString(): string {
  const baseUrl = env.DATABASE_URL;
  
  // If DATABASE_URL already has connection parameters, use it as-is
  if (baseUrl.includes('?') || baseUrl.includes('connection_limit')) {
    return baseUrl;
  }

  // Add connection pool parameters if configured
  const poolSize = env.DATABASE_POOL_SIZE;
  const poolTimeout = env.DATABASE_CONNECTION_TIMEOUT;

  if (poolSize || poolTimeout) {
    const url = new URL(baseUrl);
    
    if (poolSize && !url.searchParams.has('connection_limit')) {
      // Connection pool size (recommended: 1-10 per CPU core)
      url.searchParams.set('connection_limit', poolSize.toString());
    }

    if (poolTimeout && !url.searchParams.has('pool_timeout')) {
      // Connection pool timeout in seconds
      url.searchParams.set('pool_timeout', poolTimeout.toString());
    }

    // PostgreSQL connection timeout
    if (!url.searchParams.has('connect_timeout')) {
      url.searchParams.set('connect_timeout', '10');
    }

    return url.toString();
  }

  return baseUrl;
}

/**
 * Prisma Client configuration with connection pooling
 */
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  
  // Connection pool configuration
  datasources: {
    db: {
      url: buildConnectionString(),
    },
  },
};

// Create Prisma Client instance with connection pooling
const prisma = new PrismaClient(prismaClientOptions);

/**
 * Connection pool statistics
 */
interface ConnectionPoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
}

/**
 * Get connection pool statistics
 * Note: Prisma doesn't expose direct pool stats, but we can monitor query performance
 */
export async function getConnectionPoolStats(): Promise<ConnectionPoolStats> {
  try {
    // Execute a lightweight query to check connection health
    await prisma.$queryRaw`SELECT 1`;
    
    // Prisma manages the pool internally, so we return estimated stats
    // In production, you might want to use pg_stat_activity or similar
    return {
      activeConnections: 0, // Prisma doesn't expose this directly
      idleConnections: 0,
      totalConnections: 0,
    };
  } catch (error) {
    logger.error('Failed to get connection pool stats:', error);
    throw error;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Execute a transaction with connection pool management
 */
export async function executeTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(callback, {
    maxWait: 5000, // Maximum time to wait for a transaction slot (ms)
    timeout: 10000, // Maximum time for the transaction to complete (ms)
  });
}

/**
 * Health check for database connection pool
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - startTime;
    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  logger.info('Disconnecting Prisma client...');
  await prisma.$disconnect();
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, disconnecting Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, disconnecting Prisma client...');
  await prisma.$disconnect();
  process.exit(0);
});

// Log connection pool configuration on startup
if (process.env.NODE_ENV === 'development') {
  logger.info('Database connection pool configured:', {
    poolSize: env.DATABASE_POOL_SIZE || 10,
    connectionTimeout: env.DATABASE_CONNECTION_TIMEOUT || 10,
  });
}

export default prisma;




