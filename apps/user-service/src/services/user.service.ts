import { prisma } from '@traintravel/database';

export class UserService {
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  static async addPassenger(userId: string, data: { name: string; age: number; gender: string; idType?: string; idNumber?: string }) {
    return prisma.passenger.create({
      data: {
        userId,
        name: data.name,
        age: data.age,
        gender: data.gender,
        idType: data.idType,
        idNumber: data.idNumber,
      },
    });
  }

  static async getPassengers(userId: string) {
    return prisma.passenger.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async deletePassenger(userId: string, passengerId: string) {
    const passenger = await prisma.passenger.findFirst({
      where: { id: passengerId, userId },
    });

    if (!passenger) {
      throw new Error('Passenger not found or unauthorized');
    }

    await prisma.passenger.delete({
      where: { id: passengerId },
    });
  }
}
