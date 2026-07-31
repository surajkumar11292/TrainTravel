import { Request, Response } from 'express';
import { SeatService } from '../services/seat.service';
import { holdSeatsSchema } from '@traintravel/shared';

export class SeatController {
  static async holdSeats(req: Request, res: Response) {
    try {
      const validated = holdSeatsSchema.parse(req.body);
      const userId = (req as any).user?.userId || 'guest_user';

      const result = await SeatService.holdSeats({
        userId,
        trainId: validated.trainId,
        journeyDateStr: validated.journeyDate,
        coachClass: validated.coachClass,
        seatIds: validated.seatIds,
        quota: validated.quota,
      });

      return res.status(200).json({
        success: true,
        message: 'Seats held successfully for 10 minutes',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to hold seats',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async releaseHold(req: Request, res: Response) {
    try {
      const { holdToken } = req.body;
      if (!holdToken) {
        return res.status(400).json({ success: false, message: 'holdToken is required' });
      }

      await SeatService.releaseHold(holdToken);
      return res.status(200).json({
        success: true,
        message: 'Seat hold released',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to release seat hold',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async tatkalQueue(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId || 'guest_user';
      const result = await SeatService.enqueueTatkalWaitingRoom(userId, req.body);
      return res.status(202).json({
        success: true,
        message: 'Added to Tatkal Virtual Waiting Room',
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Waiting room queue error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
