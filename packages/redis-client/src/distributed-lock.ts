import { redis } from './client';
import crypto from 'crypto';

const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
`;

export async function acquireLock(
  resourceKey: string,
  ttlSeconds: number = 600
): Promise<string | null> {
  const lockToken = crypto.randomBytes(16).toString('hex');
  const key = `lock:${resourceKey}`;

  // SET key token NX EX ttl
  const result = await redis.set(key, lockToken, 'EX', ttlSeconds, 'NX');
  if (result === 'OK') {
    return lockToken;
  }
  return null;
}

export async function releaseLock(resourceKey: string, lockToken: string): Promise<boolean> {
  const key = `lock:${resourceKey}`;
  const result = await redis.eval(RELEASE_LOCK_LUA, 1, key, lockToken);
  return result === 1;
}
