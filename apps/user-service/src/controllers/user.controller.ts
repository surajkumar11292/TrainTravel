import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { passengerSchema } from '@traintravel/shared';

export class UserController {
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const profile = await UserService.getProfile(userId);
      return res.status(200).json({
        success: true,
        data: profile,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        message: err.message || 'Failed to fetch profile',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const updated = await UserService.updateProfile(userId, req.body);
      return res.status(200).json({
        success: true,
        message: 'Profile updated',
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to update profile',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async addPassenger(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const validated = passengerSchema.parse(req.body);
      const passenger = await UserService.addPassenger(userId, validated);
      return res.status(201).json({
        success: true,
        message: 'Passenger added',
        data: passenger,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to add passenger',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getPassengers(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const passengers = await UserService.getPassengers(userId);
      return res.status(200).json({
        success: true,
        data: passengers,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch passengers',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async deletePassenger(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { id } = req.params;
      await UserService.deletePassenger(userId, id);
      return res.status(200).json({
        success: true,
        message: 'Passenger deleted',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to delete passenger',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
