import { authRepository } from './auth.repository.js';
import { otpService } from './otp.service.js';
import { verifyRecaptcha } from './recaptcha.service.js';
import { jwtService, TokenPair } from './jwt.service.js';
import { eventBus } from '../../shared/events/bus.js';
import { AppError } from '../../shared/errors/AppError.js';
import { User } from '../../shared/prisma/client.js';

export class AuthService {
  async requestOtp(data: { emailOrPhone: string; recaptchaToken?: string }): Promise<{ message: string }> {
    const { emailOrPhone, recaptchaToken } = data;

    if (recaptchaToken) {
      const isValid = await verifyRecaptcha(recaptchaToken);
      if (!isValid) {
        throw new AppError('RECAPTCHA_FAILED', 'reCAPTCHA verification failed. Bot activity suspected.', 403);
      }
    }

    await otpService.checkRateLimit(emailOrPhone);
    const code = otpService.generateCode();
    await otpService.storeOtp(emailOrPhone, code);

    const channel = emailOrPhone.includes('@') ? 'EMAIL' : 'SMS';

    // Publish event for notification domain to send OTP asynchronously
    await eventBus.publish('otp.requested', {
      target: emailOrPhone,
      channel,
      code,
    });

    // In non-production, log OTP code to console for easy testing
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔑 [DEV-ONLY] OTP for ${emailOrPhone} is: ${code}`);
    }

    return { message: 'OTP sent' };
  }

  async verifyOtp(data: { emailOrPhone: string; code: string }): Promise<{ user: User; tokens: TokenPair }> {
    const { emailOrPhone, code } = data;

    await otpService.verifyOtp(emailOrPhone, code);

    let user = await authRepository.findUserByEmailOrPhone(emailOrPhone);
    let isNewUser = false;

    if (!user) {
      const isEmail = emailOrPhone.includes('@');
      user = await authRepository.createUser({
        email: isEmail ? emailOrPhone : undefined,
        phone: !isEmail ? emailOrPhone : undefined,
        emailVerified: isEmail,
        phoneVerified: !isEmail,
      });
      isNewUser = true;
    }

    if (isNewUser) {
      await eventBus.publish('user.registered', {
        userId: user.id,
        email: user.email || undefined,
        phone: user.phone || undefined,
      });
    }

    const tokens = await jwtService.issueTokenPair(user.id);
    return { user, tokens };
  }

  async loginWithGoogleProfile(profile: {
    googleId: string;
    email?: string;
  }): Promise<{ user: User; tokens: TokenPair }> {
    let user = await authRepository.findUserByGoogleId(profile.googleId);
    let isNewUser = false;

    if (!user && profile.email) {
      user = await authRepository.findUserByEmailOrPhone(profile.email);
    }

    if (!user) {
      user = await authRepository.createUser({
        googleId: profile.googleId,
        email: profile.email,
        emailVerified: true,
      });
      isNewUser = true;
    }

    if (isNewUser) {
      await eventBus.publish('user.registered', {
        userId: user.id,
        email: user.email || undefined,
      });
    }

    const tokens = await jwtService.issueTokenPair(user.id);
    return { user, tokens };
  }

  async refreshSession(refreshToken: string): Promise<TokenPair> {
    const decoded = jwtService.verifyRefreshToken(refreshToken);
    const tokenHash = jwtService.hashToken(refreshToken);

    const dbToken = await authRepository.findRefreshTokenByHash(tokenHash);
    if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
      throw new AppError('UNAUTHORIZED', 'Invalid or revoked refresh token', 401);
    }

    await jwtService.revokeSession(decoded.sub, decoded.jti, tokenHash);
    return jwtService.issueTokenPair(decoded.sub);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      try {
        const decoded = jwtService.verifyRefreshToken(refreshToken);
        const tokenHash = jwtService.hashToken(refreshToken);
        await jwtService.revokeSession(userId, decoded.jti, tokenHash);
        return;
      } catch {
        // Fallthrough if token invalid
      }
    }

    await authRepository.revokeAllUserRefreshTokens(userId);
  }
}

export const authService = new AuthService();
