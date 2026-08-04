import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../shared/config/env.js';
import { redis } from '../../shared/redis/client.js';
import { authRepository } from './auth.repository.js';
import { AppError } from '../../shared/errors/AppError.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JwtService {
  private readonly REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // 7 days

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async issueTokenPair(userId: string): Promise<TokenPair> {
    const tokenId = crypto.randomUUID();

    const accessToken = jwt.sign(
      { sub: userId },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { sub: userId, jti: tokenId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
    );

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.REFRESH_TTL_SEC * 1000);

    // Save refresh token hash in DB
    await authRepository.createRefreshToken({
      userId,
      tokenHash,
      expiresAt,
    });

    // Save session in Redis
    const sessionKey = `session:${userId}:${tokenId}`;
    await redis.set(sessionKey, tokenHash, 'EX', this.REFRESH_TTL_SEC);

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): { sub: string } {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired access token', 401);
    }
  }

  verifyRefreshToken(token: string): { sub: string; jti: string } {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; jti: string };
    } catch {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired refresh token', 401);
    }
  }

  async revokeSession(userId: string, tokenId: string, tokenHash: string): Promise<void> {
    const sessionKey = `session:${userId}:${tokenId}`;
    await redis.del(sessionKey);

    const dbToken = await authRepository.findRefreshTokenByHash(tokenHash);
    if (dbToken) {
      await authRepository.revokeRefreshToken(dbToken.id);
    }
  }
}

export const jwtService = new JwtService();
