import { createClient, RedisClientType } from 'redis';
import { env } from './env';
import logger from './logger';

let redisClient: RedisClientType | null = null;

// Create Redis client
export const getRedisClient = async (): Promise<RedisClientType> => {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    url: env.REDIS_URL,
  }) as RedisClientType;

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
  });

  redisClient.on('ready', () => {
    logger.info('Redis Client Ready');
  });

  redisClient.on('end', () => {
    logger.warn('Redis Client Connection Ended');
  });

  await redisClient.connect();

  return redisClient;
};

// Close Redis connection
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis Client Disconnected');
  }
};

// Cache helper functions
export const cache = {
  // Get value from cache
  get: async (key: string): Promise<string | null> => {
    try {
      const client = await getRedisClient();
      return await client.get(key);
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  // Set value in cache
  set: async (key: string, value: string, ttl?: number): Promise<boolean> => {
    try {
      const client = await getRedisClient();
      if (ttl) {
        await client.setEx(key, ttl, value);
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  // Delete value from cache
  del: async (key: string): Promise<boolean> => {
    try {
      const client = await getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },

  // Delete multiple keys matching pattern
  delPattern: async (pattern: string): Promise<boolean> => {
    try {
      const client = await getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key: string): Promise<boolean> => {
    try {
      const client = await getRedisClient();
      const result = await client.exists(key);
      return result > 0;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  // Get and set with JSON serialization
  getJSON: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await cache.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      logger.error(`Cache getJSON error for key ${key}:`, error);
      return null;
    }
  },

  // Set with JSON serialization
  setJSON: async <T>(key: string, value: T, ttl?: number): Promise<boolean> => {
    try {
      const jsonValue = JSON.stringify(value);
      return await cache.set(key, jsonValue, ttl);
    } catch (error) {
      logger.error(`Cache setJSON error for key ${key}:`, error);
      return false;
    }
  },
};

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await closeRedisConnection();
});

