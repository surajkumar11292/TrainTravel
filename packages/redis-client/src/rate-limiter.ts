import { redis } from './client';

export interface RateLimitOptions {
  windowMs: number; // e.g. 60000 (1 min)
  maxRequests: number; // e.g. 60
}

export async function isRateLimited(
  key: string,
  options: RateLimitOptions
): Promise<{ limited: boolean; current: number; remaining: number; resetMs: number }> {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const redisKey = `ratelimit:${key}`;

  // Multi transaction: remove old entries, add current timestamp, count valid requests, set expiry
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
  pipeline.zcard(redisKey);
  pipeline.pexpire(redisKey, options.windowMs);

  const results = await pipeline.exec();
  const currentCount = (results?.[2]?.[1] as number) || 1;

  const limited = currentCount > options.maxRequests;
  const remaining = Math.max(0, options.maxRequests - currentCount);
  const resetMs = options.windowMs;

  return { limited, current: currentCount, remaining, resetMs };
}
