import { prisma, User, RefreshToken } from '../../shared/prisma/client.js';

export class AuthRepository {
  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findUserByEmailOrPhone(target: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [{ email: target }, { phone: target }],
      },
    });
  }

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleId } });
  }

  async createUser(data: {
    email?: string;
    phone?: string;
    googleId?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({ data });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revokeRefreshToken(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }
}

export const authRepository = new AuthRepository();
