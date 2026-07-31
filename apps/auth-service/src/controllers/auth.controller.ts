import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '@traintravel/shared';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validated = registerSchema.parse(req.body);
      const recaptchaValid = await AuthService.verifyRecaptcha(validated.recaptchaToken);
      if (!recaptchaValid) {
        return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed' });
      }

      const result = await AuthService.register(validated);
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Registration failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const validated = loginSchema.parse(req.body);
      const recaptchaValid = await AuthService.verifyRecaptcha(validated.recaptchaToken);
      if (!recaptchaValid) {
        return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed' });
      }

      const result = await AuthService.login(validated);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        message: err.message || 'Authentication failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token required' });
      }

      const result = await AuthService.refresh(refreshToken);
      return res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        message: err.message || 'Token refresh failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async googleOAuth(req: Request, res: Response) {
    try {
      const { googleToken } = req.body;
      const result = await AuthService.googleOAuthLogin(googleToken);
      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Google OAuth failed',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
