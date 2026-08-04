import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from './auth.service.js';

const requestOtpSchema = z.object({
  emailOrPhone: z.string().min(3, 'Email or phone number is required'),
  recaptchaToken: z.string().optional(),
});

const verifyOtpSchema = z.object({
  emailOrPhone: z.string().min(3, 'Email or phone number is required'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  async requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = requestOtpSchema.parse(req.body);
      const result = await authService.requestOtp(input);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = verifyOtpSchema.parse(req.body);
      const { user, tokens } = await authService.verifyOtp(input);

      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Refresh token missing' },
        });
        return;
      }

      const tokens = await authService.refreshSession(refreshToken);
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        data: { accessToken: tokens.accessToken },
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const refreshToken = req.cookies?.refreshToken;

      if (userId) {
        await authService.logout(userId, refreshToken);
      }

      res.clearCookie('refreshToken');
      res.status(200).json({ success: true, data: { message: 'Logged out successfully' } });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
