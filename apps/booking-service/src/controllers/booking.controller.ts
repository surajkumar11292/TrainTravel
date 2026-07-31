import { Request, Response } from 'express';
import { BookingService } from '../services/booking.service';
import { createBookingSchema } from '@traintravel/shared';

export class BookingController {
  static async createBooking(req: Request, res: Response) {
    try {
      const validated = createBookingSchema.parse(req.body);
      const userId = (req as any).user?.userId || 'guest_user';

      const booking = await BookingService.createBooking({
        userId,
        holdToken: validated.holdToken,
        passengers: validated.passengers,
        idempotencyKey: validated.idempotencyKey,
      });

      return res.status(201).json({
        success: true,
        message: 'Booking initiated successfully. Please complete payment within 10 minutes.',
        data: booking,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to create booking',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getBooking(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || 'guest_user';
      const { id } = req.params;
      const booking = await BookingService.getBookingById(userId, id);

      return res.status(200).json({
        success: true,
        data: booking,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        message: err.message || 'Booking not found',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getBookingByPNR(req: Request, res: Response) {
    try {
      const { pnrNo } = req.params;
      const booking = await BookingService.getBookingByPNR(pnrNo);

      return res.status(200).json({
        success: true,
        data: booking,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        message: err.message || 'Booking not found for provided PNR',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getUserBookings(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || 'guest_user';
      const bookings = await BookingService.getUserBookings(userId);

      return res.status(200).json({
        success: true,
        data: bookings,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user bookings',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async cancelBooking(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || 'guest_user';
      const { id } = req.params;
      const booking = await BookingService.cancelBooking(userId, id);

      return res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to cancel booking',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
