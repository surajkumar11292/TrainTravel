import { Request, Response, NextFunction } from 'express';
import { isRateLimited } from '@traintravel/redis-client';
import { logger } from '@traintravel/logger';

export function createRateLimiter(options: { windowMs: number; maxRequests: number; keyPrefix?: string }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${options.keyPrefix || 'global'}:${ip}`;

    try {
      const result = await isRateLimited(key, { windowMs: options.windowMs, maxRequests: options.maxRequests });

      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);

      if (result.limited) {
        logger.warn(`Rate limit exceeded for IP: ${ip} on route: ${req.originalUrl}`);
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          retryAfterMs: result.resetMs,
          timestamp: new Date().toISOString(),
        });
      }

      return next();
    } catch (err) {
      logger.error('Rate limiter middleware error:', err);
      return next(); // Fail open in case of Redis glitch
    }
  };
}
