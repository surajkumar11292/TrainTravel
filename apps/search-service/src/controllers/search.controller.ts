import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { searchTrainSchema } from '@traintravel/shared';
import { CoachType, Quota } from '@traintravel/database';

export class SearchController {
  static async searchTrains(req: Request, res: Response) {
    try {
      const { fromStation, toStation, journeyDate, class: coachClass, quota } = req.query as any;

      if (!fromStation || !toStation || !journeyDate) {
        return res.status(400).json({
          success: false,
          message: 'fromStation, toStation, and journeyDate are required parameters',
          timestamp: new Date().toISOString(),
        });
      }

      const results = await SearchService.searchTrains(
        fromStation as string,
        toStation as string,
        journeyDate as string,
        coachClass as CoachType,
        (quota as Quota) || Quota.GENERAL
      );

      return res.status(200).json({
        success: true,
        count: results.length,
        data: results,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Search error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getSeatAvailability(req: Request, res: Response) {
    try {
      const { trainId, journeyDate, coachClass, quota } = req.query as any;

      if (!trainId || !journeyDate || !coachClass) {
        return res.status(400).json({
          success: false,
          message: 'trainId, journeyDate, and coachClass are required',
          timestamp: new Date().toISOString(),
        });
      }

      const availability = await SearchService.getSeatAvailability(
        trainId,
        journeyDate,
        coachClass as CoachType,
        (quota as Quota) || Quota.GENERAL
      );

      return res.status(200).json({
        success: true,
        data: availability,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Availability query error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
