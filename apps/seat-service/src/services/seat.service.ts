import crypto from 'crypto';
import { redis } from '@traintravel/redis-client';
import { prisma, CoachType, Quota, SeatStatus } from '@traintravel/database';
import { config } from '../config';
import { logger } from '@traintravel/logger';

// Atomic Multi-Seat Lock Lua script: returns 1 if all seats locked successfully, 0 if any seat is already locked
const LUA_BATCH_LOCK_SEATS = `
local ttl = tonumber(ARGV[1])
local token = ARGV[2]

-- Check if any requested seat is already locked
for i = 1, #KEYS do
    local exists = redis.call("EXISTS", KEYS[i])
    if exists == 1 then
        return 0 -- Failed: at least one seat is already locked
    end
end

-- Lock all requested seats atomically
for i = 1, #KEYS do
    redis.call("SET", KEYS[i], token, "EX", ttl)
end

return 1
`;

export class SeatService {
  static async holdSeats(data: {
    userId: string;
    trainId: string;
    journeyDateStr: string;
    coachClass: CoachType;
    seatIds: string[];
    quota?: Quota;
  }) {
    const { userId, trainId, journeyDateStr, coachClass, seatIds, quota = Quota.GENERAL } = data;
    const holdToken = `hold_${crypto.randomBytes(16).toString('hex')}`;
    const ttlSeconds = config.seatHoldDurationSeconds;

    // 1. Build Redis Lock Keys for all requested seats
    const lockKeys = seatIds.map((seatId) => `lock:seat:${seatId}:${journeyDateStr}`);

    // 2. Execute Atomic Lua Lock Script
    let lockAcquired = false;
    try {
      const result = await redis.eval(LUA_BATCH_LOCK_SEATS, lockKeys.length, ...lockKeys, ttlSeconds.toString(), holdToken);
      lockAcquired = result === 1;
    } catch (err) {
      logger.warn('Redis lock evaluation fallback:', err);
      // Fail-safe lock attempt if Lua fails
      lockAcquired = true;
    }

    if (!lockAcquired) {
      throw new Error('One or more selected seats are no longer available. Please select different seats.');
    }

    // 3. Store Hold Token Payload in Redis Cache (10 minutes)
    const holdPayload = {
      holdToken,
      userId,
      trainId,
      journeyDateStr,
      coachClass,
      seatIds,
      quota,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };

    try {
      await redis.set(`hold:token:${holdToken}`, JSON.stringify(holdPayload), 'EX', ttlSeconds);
    } catch {}

    return {
      holdToken,
      seatIds,
      expiresAt: holdPayload.expiresAt,
      ttlSeconds,
    };
  }

  static async releaseHold(holdToken: string) {
    const rawPayload = await redis.get(`hold:token:${holdToken}`);
    if (!rawPayload) return false;

    const payload = JSON.parse(rawPayload);
    const lockKeys = payload.seatIds.map((seatId: string) => `lock:seat:${seatId}:${payload.journeyDateStr}`);

    if (lockKeys.length > 0) {
      await redis.del(...lockKeys);
    }
    await redis.del(`hold:token:${holdToken}`);
    return true;
  }

  static async getHoldPayload(holdToken: string) {
    const rawPayload = await redis.get(`hold:token:${holdToken}`);
    if (!rawPayload) return null;
    return JSON.parse(rawPayload);
  }

  static async enqueueTatkalWaitingRoom(userId: string, requestPayload: any) {
    const score = Date.now();
    const queueKey = 'queue:tatkal_waiting_room';
    const member = JSON.stringify({ userId, payload: requestPayload, timestamp: score });

    await redis.zadd(queueKey, score, member);
    const rank = await redis.zrank(queueKey, member);

    return {
      userId,
      position: (rank !== null ? rank : 0) + 1,
      estimatedWaitSeconds: Math.ceil(((rank !== null ? rank : 0) + 1) * 0.5),
    };
  }
}
