import { Request, Response, NextFunction } from 'express';
import { redis } from '../../shared/redis/client.js';
import { AppError } from '../../shared/errors/AppError.js';

interface RateLimiterOptions {
  windowSec: number;
  maxRequests: number;
  keyPrefix?: string;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowSec, maxRequests, keyPrefix = 'ratelimit' } = options;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const route = req.baseUrl + req.path;
      const key = `${keyPrefix}:${ip}:${route}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSec);
      }

      if (current > maxRequests) {
        throw new AppError(
          'TOO_MANY_REQUESTS',
          `Too many requests. Please try again in ${windowSec} seconds.`,
          429
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
