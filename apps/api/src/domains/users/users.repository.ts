import { prisma, Profile, SavedPassenger } from '../../shared/prisma/client.js';

export class UsersRepository {
  async findProfileByUserId(userId: string): Promise<Profile | null> {
    return prisma.profile.findUnique({ where: { userId } });
  }

  async upsertProfile(
    userId: string,
    data: { fullName?: string; defaultEmail?: string; defaultPhone?: string }
  ): Promise<Profile> {
    return prisma.profile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  async findSavedPassengersByUserId(userId: string): Promise<SavedPassenger[]> {
    return prisma.savedPassenger.findMany({ where: { userId } });
  }

  async createSavedPassenger(data: {
    userId: string;
    name: string;
    age: number;
    gender: string;
    berthPref?: string;
  }): Promise<SavedPassenger> {
    return prisma.savedPassenger.create({ data });
  }

  async deleteSavedPassenger(id: string, userId: string): Promise<boolean> {
    const result = await prisma.savedPassenger.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}

export const usersRepository = new UsersRepository();
