import Redis, { RedisOptions } from 'ioredis';
import { env } from '../config/env.js';

export const redisOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
};

export function createRedisClient(): Redis {
  return new Redis(redisOptions);
}

export const redis = createRedisClient();
