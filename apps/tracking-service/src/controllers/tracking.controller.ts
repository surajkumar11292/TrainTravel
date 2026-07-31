import { Request, Response } from 'express';
import { TrackingService } from '../services/tracking.service';

export class TrackingController {
  static async getLiveStatus(req: Request, res: Response) {
    try {
      const { trainId } = req.params;
      const status = await TrackingService.getLiveTrainStatus(trainId);

      return res.status(200).json({
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch live train tracking status',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async updateLocation(req: Request, res: Response) {
    try {
      const { trainId } = req.params;
      const { latitude, longitude, speedKmh, delayMinutes } = req.body;

      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
      }

      const updated = await TrackingService.updateTrainLocation(trainId, {
        latitude: Number(latitude),
        longitude: Number(longitude),
        speedKmh: Number(speedKmh || 80),
        delayMinutes: Number(delayMinutes || 0),
      });

      return res.status(200).json({
        success: true,
        message: 'Live train location broadcasted',
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to update live train location',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
