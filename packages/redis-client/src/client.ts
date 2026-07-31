import Redis from 'ioredis';
import { logger } from '@traintravel/logger';

const host = process.env.REDIS_HOST || 'localhost';
const port = parseInt(process.env.REDIS_PORT || '6379', 10);
const password = process.env.REDIS_PASSWORD || undefined;

export const redis = new Redis({
  host,
  port,
  password,
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: process.env.NODE_ENV === 'test' ? 0 : 20,
  retryStrategy(times) {
    if (process.env.NODE_ENV === 'test') return null; // Disable retries in unit test mode
    const delay = Math.min(times * 100, 3000);
    logger.warn(`Redis reconnecting... attempt #${times}, delay: ${delay}ms`);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Connected to Redis instance');
});

redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.error('Redis error:', err);
  }
});
