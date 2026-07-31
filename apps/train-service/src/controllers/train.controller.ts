import { Request, Response } from 'express';
import { TrainService } from '../services/train.service';

export class TrainController {
  static async getTrains(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const search = req.query.search as string;

      const result = await TrainService.getTrains(page, limit, search);
      return res.status(200).json({
        success: true,
        data: result.trains,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch trains',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getTrainById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const train = await TrainService.getTrainById(id);
      return res.status(200).json({
        success: true,
        data: train,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        message: err.message || 'Train not found',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getTrainSchedule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schedule = await TrainService.getTrainSchedule(id);
      return res.status(200).json({
        success: true,
        data: schedule,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        message: err.message || 'Schedule not found',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async createTrain(req: Request, res: Response) {
    try {
      const train = await TrainService.createTrain(req.body);
      return res.status(201).json({
        success: true,
        message: 'Train created successfully',
        data: train,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Failed to create train',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getStations(req: Request, res: Response) {
    try {
      const search = req.query.search as string;
      const stations = await TrainService.getStations(search);
      return res.status(200).json({
        success: true,
        data: stations,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch stations',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getStationByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const station = await TrainService.getStationByCode(code);
      return res.status(200).json({
        success: true,
        data: station,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        message: err.message || 'Station not found',
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async autocompleteStations(req: Request, res: Response) {
    try {
      const query = (req.query.q as string) || '';
      const stations = await TrainService.autocompleteStations(query);
      return res.status(200).json({
        success: true,
        data: stations,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Autocomplete error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
