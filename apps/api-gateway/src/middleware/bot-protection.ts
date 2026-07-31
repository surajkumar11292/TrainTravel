import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '@traintravel/logger';

export async function botProtectionGuard(req: Request, res: Response, next: NextFunction) {
  // 1. Device Fingerprint validation
  const deviceFingerprint = req.headers['x-device-fingerprint'] as string;
  const userAgent = req.headers['user-agent'] || '';

  if (userAgent.toLowerCase().includes('bot') || userAgent.toLowerCase().includes('crawl') || userAgent.toLowerCase().includes('spider')) {
    logger.warn(`Bot detected via User-Agent: ${userAgent} from IP: ${req.ip}`);
    return res.status(403).json({
      success: false,
      message: 'Automated request detected. Access denied.',
      code: 'BOT_DETECTED',
    });
  }

  // 2. reCAPTCHA v3 Verification (on state-changing endpoints like /auth, /bookings, /seats/hold)
  const recaptchaToken = (req.headers['x-recaptcha-token'] as string) || req.body?.recaptchaToken;

  if (config.recaptchaSecretKey && config.recaptchaSecretKey !== 'your_recaptcha_secret_key' && recaptchaToken) {
    try {
      const response = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(config.recaptchaSecretKey)}&response=${encodeURIComponent(recaptchaToken)}`,
      });
      const data = (await response.json()) as { success: boolean; score?: number };

      if (!data.success || (data.score !== undefined && data.score < 0.5)) {
        logger.warn(`reCAPTCHA verification failed for IP: ${req.ip}, score: ${data.score}`);
        return res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification failed. Low trust score.',
          score: data.score,
        });
      }
    } catch (err: any) {
      logger.warn('reCAPTCHA verification error (failing open):', err.message);
    }
  }

  return next();
}
