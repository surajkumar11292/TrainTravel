import crypto from 'crypto';
import { redis } from '../../shared/redis/client.js';
import { AppError } from '../../shared/errors/AppError.js';

export class OtpService {
  private readonly OTP_TTL_SEC = 300; // 5 minutes
  private readonly RATE_LIMIT_WINDOW_SEC = 600; // 10 minutes
  private readonly MAX_OTP_REQUESTS = 3;

  generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async checkRateLimit(target: string): Promise<void> {
    const rateLimitKey = `otp:ratelimit:${target}`;
    const requests = await redis.incr(rateLimitKey);

    if (requests === 1) {
      await redis.expire(rateLimitKey, this.RATE_LIMIT_WINDOW_SEC);
    }

    if (requests > this.MAX_OTP_REQUESTS) {
      throw new AppError(
        'OTP_RATE_LIMIT_EXCEEDED',
        'Too many OTP requests. Please wait 10 minutes before trying again.',
        429
      );
    }
  }

  async storeOtp(target: string, code: string): Promise<void> {
    const otpKey = `otp:${target}`;
    await redis.set(otpKey, code, 'EX', this.OTP_TTL_SEC);
  }

  async verifyOtp(target: string, code: string): Promise<boolean> {
    const otpKey = `otp:${target}`;
    const storedCode = await redis.get(otpKey);

    if (!storedCode) {
      throw new AppError('OTP_EXPIRED', 'OTP code has expired or was not requested.', 400);
    }

    if (storedCode !== code) {
      throw new AppError('OTP_INVALID', 'Invalid OTP code.', 400);
    }

    // Delete OTP once verified to prevent replay
    await redis.del(otpKey);
    return true;
  }
}

export const otpService = new OtpService();
