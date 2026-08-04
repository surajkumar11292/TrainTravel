import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { usersService } from './users.service.js';
import { AuthenticatedRequest } from '../../gateway/middleware/auth.middleware.js';
import { AppError } from '../../shared/errors/AppError.js';

const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  defaultEmail: z.string().email().optional(),
  defaultPhone: z.string().min(10).optional(),
});

const createPassengerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().min(1).max(120),
  gender: z.enum(['M', 'F', 'O']),
  berthPref: z.string().optional(),
});

export class UsersController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User unauthorized', 401);

      const profile = await usersService.getProfile(userId);
      res.status(200).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User unauthorized', 401);

      const input = updateProfileSchema.parse(req.body);
      const updatedProfile = await usersService.updateProfile(userId, input);
      res.status(200).json({ success: true, data: updatedProfile });
    } catch (err) {
      next(err);
    }
  }

  async getPassengers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User unauthorized', 401);

      const passengers = await usersService.getSavedPassengers(userId);
      res.status(200).json({ success: true, data: passengers });
    } catch (err) {
      next(err);
    }
  }

  async createPassenger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User unauthorized', 401);

      const input = createPassengerSchema.parse(req.body);
      const newPassenger = await usersService.addSavedPassenger(userId, input);
      res.status(201).json({ success: true, data: newPassenger });
    } catch (err) {
      next(err);
    }
  }

  async deletePassenger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) throw new AppError('UNAUTHORIZED', 'User unauthorized', 401);

      const { id } = req.params;
      await usersService.removeSavedPassenger(userId, id);
      res.status(200).json({ success: true, data: { message: 'Passenger deleted successfully' } });
    } catch (err) {
      next(err);
    }
  }
}

export const usersController = new UsersController();
