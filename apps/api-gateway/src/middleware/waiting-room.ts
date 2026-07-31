import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '@traintravel/redis-client';
import { config } from '../config';
import { logger } from '@traintravel/logger';

export const WAITING_ROOM_QUEUE_KEY = 'queue:tatkal_waiting_room';

export async function waitingRoomGuard(req: Request, res: Response, next: NextFunction) {
  // Check if Tatkal window / high load queue enforcement is active
  const admissionToken = req.headers['x-admission-token'] as string;

  if (admissionToken) {
    try {
      const decoded = jwt.verify(admissionToken, config.jwtAccessSecret) as any;
      if (decoded && decoded.type === 'WAITING_ROOM_ADMISSION') {
        return next(); // Admitted! Proceed to downstream service
      }
    } catch {
      logger.warn(`Expired or invalid admission token from IP: ${req.ip}`);
    }
  }

  // Check if user is already in waiting room queue in Redis
  const userId = (req as any).user?.id || req.ip || 'guest';
  const score = Date.now();
  const member = JSON.stringify({ userId, ip: req.ip, timestamp: score });

  try {
    // Add to ZSET if not present
    await redis.zadd(WAITING_ROOM_QUEUE_KEY, score, member);
    const rank = await redis.zrank(WAITING_ROOM_QUEUE_KEY, member);
    const position = (rank !== null ? rank : 0) + 1;
    const estimatedWaitSeconds = Math.ceil(position * 2);

    return res.status(429).json({
      success: false,
      code: 'WAITING_ROOM_ENQUEUED',
      message: 'High traffic detected. You have been placed in the Tatkal Virtual Waiting Room.',
      position,
      estimatedWaitSeconds,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn('Waiting room Redis fallback (failing open):', err);
    return next(); // Fail open if Redis is down
  }
}
