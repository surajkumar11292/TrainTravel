import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '@traintravel/redis-client';
import { config } from '../config';
import { WAITING_ROOM_QUEUE_KEY } from '../middleware/waiting-room';

export class WaitingRoomController {
  static async joinQueue(req: Request, res: Response) {
    const userId = (req as any).user?.id || req.body.userId || req.ip || 'guest';
    const score = Date.now();
    const memberPayload = { userId, ip: req.ip, timestamp: score };
    const member = JSON.stringify(memberPayload);

    try {
      await redis.zadd(WAITING_ROOM_QUEUE_KEY, score, member);
      const rank = await redis.zrank(WAITING_ROOM_QUEUE_KEY, member);
      const position = (rank !== null ? rank : 0) + 1;
      const estimatedWaitSeconds = Math.ceil(position * 2);

      return res.status(200).json({
        success: true,
        message: 'Entered Tatkal Virtual Waiting Room',
        userId,
        position,
        estimatedWaitSeconds,
        timestamp: new Date().toISOString(),
      });
    } catch {
      return res.status(200).json({
        success: true,
        message: 'Direct admission (Queue offline mode)',
        userId,
        position: 1,
        estimatedWaitSeconds: 0,
      });
    }
  }

  static async getQueueStatus(req: Request, res: Response) {
    const userId = (req as any).user?.id || (req.query.userId as string) || req.ip || 'guest';

    try {
      const items = await redis.zrange(WAITING_ROOM_QUEUE_KEY, 0, -1);
      let position = 0;
      let totalInQueue = items.length;

      for (let i = 0; i < items.length; i++) {
        try {
          const parsed = JSON.parse(items[i]);
          if (parsed.userId === userId || parsed.ip === req.ip) {
            position = i + 1;
            break;
          }
        } catch {}
      }

      const isAdmitted = position === 0 || position === 1;
      let admissionToken: string | undefined;

      if (isAdmitted) {
        admissionToken = jwt.sign(
          { userId, type: 'WAITING_ROOM_ADMISSION' },
          config.jwtAccessSecret,
          { expiresIn: '5m' }
        );
      }

      return res.status(200).json({
        success: true,
        userId,
        position: position || 1,
        totalInQueue,
        estimatedWaitSeconds: Math.ceil((position || 1) * 2),
        isAdmitted,
        admissionToken,
      });
    } catch {
      const dummyToken = jwt.sign(
        { userId, type: 'WAITING_ROOM_ADMISSION' },
        config.jwtAccessSecret,
        { expiresIn: '5m' }
      );
      return res.status(200).json({
        success: true,
        userId,
        position: 1,
        totalInQueue: 1,
        estimatedWaitSeconds: 0,
        isAdmitted: true,
        admissionToken: dummyToken,
      });
    }
  }

  static async exitQueue(req: Request, res: Response) {
    const userId = (req as any).user?.id || req.body.userId || req.ip || 'guest';

    try {
      const items = await redis.zrange(WAITING_ROOM_QUEUE_KEY, 0, -1);
      for (const item of items) {
        try {
          const parsed = JSON.parse(item);
          if (parsed.userId === userId || parsed.ip === req.ip) {
            await redis.zrem(WAITING_ROOM_QUEUE_KEY, item);
            break;
          }
        } catch {}
      }
    } catch {}

    return res.status(200).json({
      success: true,
      message: 'Successfully exited Virtual Waiting Room',
    });
  }
}
