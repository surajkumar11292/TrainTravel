import { redis } from './client';

export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds?: number): Promise<void> {
  const stringified = JSON.stringify(value);
  if (ttlSeconds) {
    await redis.set(key, stringified, 'EX', ttlSeconds);
  } else {
    await redis.set(key, stringified);
  }
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}
