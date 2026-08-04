import { usersRepository } from './users.repository.js';
import { Profile, SavedPassenger } from '../../shared/prisma/client.js';
import { AppError } from '../../shared/errors/AppError.js';

export class UsersService {
  async getProfile(userId: string): Promise<Profile> {
    let profile = await usersRepository.findProfileByUserId(userId);
    if (!profile) {
      profile = await usersRepository.upsertProfile(userId, {});
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; defaultEmail?: string; defaultPhone?: string }
  ): Promise<Profile> {
    return usersRepository.upsertProfile(userId, data);
  }

  async getSavedPassengers(userId: string): Promise<SavedPassenger[]> {
    return usersRepository.findSavedPassengersByUserId(userId);
  }

  async addSavedPassenger(
    userId: string,
    data: { name: string; age: number; gender: string; berthPref?: string }
  ): Promise<SavedPassenger> {
    return usersRepository.createSavedPassenger({
      userId,
      ...data,
    });
  }

  async removeSavedPassenger(userId: string, passengerId: string): Promise<void> {
    const deleted = await usersRepository.deleteSavedPassenger(passengerId, userId);
    if (!deleted) {
      throw new AppError('NOT_FOUND', 'Saved passenger not found', 404);
    }
  }
}

export const usersService = new UsersService();
